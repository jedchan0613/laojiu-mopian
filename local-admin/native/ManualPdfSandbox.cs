// Windows本机PDF执行边界。仅信任服务端配置；不读取浏览器参数、密码或环境密钥。
// .NET Framework随Windows提供；按源代码摘要编译到私密缓存，不安装服务或全局组件。
using System;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;

public static class ManualPdfSandbox {
  [StructLayout(LayoutKind.Sequential)] struct SA { public int length; public IntPtr descriptor; [MarshalAs(UnmanagedType.Bool)] public bool inherit; }
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct SI { public int cb; public string reserved,desktop,title; public uint x,y,xs,ys,xc,yc,fill,flags; public short show,reservedSize; public IntPtr reserved2,stdin,stdout,stderr; }
  [StructLayout(LayoutKind.Sequential)] struct SIX { public SI si; public IntPtr attrs; }
  [StructLayout(LayoutKind.Sequential)] struct PI { public IntPtr process,thread; public uint pid,tid; }
  [StructLayout(LayoutKind.Sequential)] struct CAP { public IntPtr sid,caps; public uint count,reserved; }
  [StructLayout(LayoutKind.Sequential)] struct BL { public long processTime,jobTime; public uint flags; public UIntPtr minWorking,maxWorking; public uint activeLimit; public UIntPtr affinity; public uint priority,scheduling; }
  [StructLayout(LayoutKind.Sequential)] struct IO { public ulong r,w,other,rb,wb,ob; }
  [StructLayout(LayoutKind.Sequential)] struct EL { public BL basic; public IO io; public UIntPtr processMemory,jobMemory,peakProcess,peakJob; }
  [StructLayout(LayoutKind.Sequential)] struct ACC { public long user,kernel,thisuser,thiskernel; public uint faults,total,active,terminated; }
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateJobObjectW(IntPtr sa,string name);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int type,ref EL data,int size);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job,int type,ref EL data,int size,IntPtr length);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job,int type,ref ACC data,int size,IntPtr length);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateJobObject(IntPtr job,uint code);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateProcess(IntPtr process,uint code);
  [DllImport("kernel32.dll",SetLastError=true)] static extern uint WaitForSingleObject(IntPtr h,uint ms);
  [DllImport("kernel32.dll",SetLastError=true)] static extern uint ResumeThread(IntPtr h);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr list,int count,int flags,ref IntPtr length);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr list,uint flags,IntPtr type,IntPtr data,IntPtr size,IntPtr old,IntPtr returned);
  [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr list);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool CreateProcessW(string exe,StringBuilder command,IntPtr processSA,IntPtr threadSA,bool inherit,uint flags,IntPtr env,string cwd,ref SIX startup,out PI pi);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool CreatePipe(out IntPtr read,out IntPtr write,ref SA sa,uint size);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetHandleInformation(IntPtr h,uint mask,uint flags);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool ReadFile(IntPtr h,byte[] buffer,uint size,out uint read,IntPtr overlapped);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateFileW(string name,uint access,uint sharing,ref SA sa,uint mode,uint flags,IntPtr template);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out IntPtr token);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(IntPtr token,int type,IntPtr data,int size,out int needed);
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int CreateAppContainerProfile(string name,string display,string description,IntPtr caps,uint count,out IntPtr sid);
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeriveAppContainerSidFromAppContainerName(string name,out IntPtr sid);
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeleteAppContainerProfile(string name);
  [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int GetAppContainerFolderPath(string sid,out IntPtr folder);
  [DllImport("advapi32.dll")] static extern IntPtr FreeSid(IntPtr sid);

  static JavaScriptSerializer json=new JavaScriptSerializer { MaxJsonLength=65536 };
  static Dictionary<string,object> cfg; static string root,tools,input,output,control,profile,cancelFile; static IntPtr sid=IntPtr.Zero;
  static bool created=false; static List<string> granted=new List<string>(); static int parentPid; static long parentStart; static int sequence=0;
  static void Check(bool ok,string stage) { if(!ok)throw new Win32Exception(Marshal.GetLastWin32Error(),stage); }
  static string S(Dictionary<string,object> data,string name) { return Convert.ToString(data[name]); }
  static void Emit(object value) { Console.WriteLine(json.Serialize(value)); Console.Out.Flush(); }
  static void AtomicState(object value) { string file=Path.Combine(control,"native-state.json"),tmp=file+"."+Guid.NewGuid().ToString("N")+".tmp"; File.WriteAllText(tmp,json.Serialize(value),new UTF8Encoding(false)); if(File.Exists(file))File.Replace(tmp,file,null);else File.Move(tmp,file); }
  static bool SameProcess(int pid,long ticks) { try { using(Process p=Process.GetProcessById(pid)) return !p.HasExited && p.StartTime.ToUniversalTime().Ticks==ticks; } catch(ArgumentException) { return false; } }
  static bool ParentAlive() { return SameProcess(parentPid,parentStart); }
  static void Acl(string dir,bool add) {
    string name;using(var hash=System.Security.Cryptography.SHA256.Create())name="Local\\LJM.ManualPdf.ToolAcl."+BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(tools.ToUpperInvariant()))).Replace("-","").Substring(0,24);
    using(var mutex=new Mutex(false,name)){bool held=false;try{try{held=mutex.WaitOne(10000);}catch(AbandonedMutexException){held=true;}if(!held)throw new InvalidOperationException("Tool ACL is busy.");
    var id=new SecurityIdentifier(sid);var acl=Directory.GetAccessControl(dir);var rule=new FileSystemAccessRule(id,FileSystemRights.ReadAndExecute,InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit,PropagationFlags.None,AccessControlType.Allow);
    if(add) { foreach(FileSystemAccessRule existing in acl.GetAccessRules(true,false,typeof(SecurityIdentifier)))if(existing.IdentityReference.Equals(id))throw new InvalidOperationException("Profile ACL already exists."); acl.AddAccessRule(rule); }
    else acl.RemoveAccessRuleSpecific(rule);
    Directory.SetAccessControl(dir,acl);
    }finally{if(held)mutex.ReleaseMutex();}}
  }
  static string ProfileFolder() {
    IntPtr p;int hr=GetAppContainerFolderPath(new SecurityIdentifier(sid).Value,out p);if(hr!=0)throw new InvalidOperationException("Profile folder.");
    string dir;try{dir=Path.GetFullPath(Marshal.PtrToStringUni(p));}finally{Marshal.FreeCoTaskMem(p);}
    string packages=Path.GetFullPath(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Packages"))+Path.DirectorySeparatorChar;
    if(!dir.StartsWith(packages,StringComparison.OrdinalIgnoreCase)||dir.IndexOf(profile,StringComparison.OrdinalIgnoreCase)<0)throw new InvalidOperationException("Profile location.");return dir;
  }
  static void DenyProfileWrites(bool add) {
    string dir=ProfileFolder();if(!Directory.Exists(dir))return;var acl=Directory.GetAccessControl(dir);var rule=new FileSystemAccessRule(new SecurityIdentifier(sid),FileSystemRights.Write|FileSystemRights.Delete|FileSystemRights.DeleteSubdirectoriesAndFiles|FileSystemRights.ChangePermissions|FileSystemRights.TakeOwnership,InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit,PropagationFlags.None,AccessControlType.Deny);
    if(add)acl.AddAccessRule(rule);else acl.RemoveAccessRuleSpecific(rule);Directory.SetAccessControl(dir,acl);
  }
  static void Setup(string file) {
    if(!Path.IsPathRooted(file)||new FileInfo(file).Length>65536)throw new InvalidOperationException("Config path.");cfg=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(file));
    if(Convert.ToInt32(cfg["schema"])!=1)throw new InvalidOperationException("Config version.");root=Path.GetFullPath(S(cfg,"root"));tools=Path.GetFullPath(S(cfg,"tools"));profile=S(cfg,"profile");
    if(!Regex.IsMatch(profile,@"^LJM\.ManualPdf\.[a-f0-9]{24}$")||root.Length<12||tools.Length<12||!Directory.Exists(root)||!Directory.Exists(tools))throw new InvalidOperationException("Untrusted config.");
    input=Path.Combine(root,"work","input");output=Path.Combine(root,"work","output");control=Path.Combine(root,"control");cancelFile=Path.Combine(control,"cancel.json");
    foreach(string dir in new[]{root,tools,input,output,control})if((File.GetAttributes(dir)&FileAttributes.ReparsePoint)!=0)throw new InvalidOperationException("Reparse path.");
  }
  static Dictionary<string,object> Cleanup(bool recovery) {
    bool ok=true;var errors=new List<string>();
    if(sid==IntPtr.Zero) { int hr=DeriveAppContainerSidFromAppContainerName(profile,out sid);if(hr!=0)throw new InvalidOperationException("Cannot derive owned profile."); }
    foreach(string dir in recovery?new[]{output,input,tools}:granted.ToArray())try { Acl(dir,false); }catch {ok=false;errors.Add("acl");}
    try { DenyProfileWrites(false); } catch {ok=false;errors.Add("profile-acl");}
    int deleted=DeleteAppContainerProfile(profile);if(deleted!=0 && deleted!=unchecked((int)0x80070002)){ok=false;errors.Add("profile");}
    var result=new Dictionary<string,object>{{"type","closed"},{"cleanup",ok},{"errors",errors}};AtomicState(new{profile=profile,helper_pid=Process.GetCurrentProcess().Id,helper_started=Process.GetCurrentProcess().StartTime.ToUniversalTime().Ticks.ToString(),closed=true,cleanup=ok});return result;
  }
  static string Quote(string value) {
    if(value.IndexOf('\0')>=0||value.Length>32760)throw new InvalidOperationException("Argument.");var b=new StringBuilder("\"");int slashes=0;foreach(char c in value){if(c=='\\'){slashes++;continue;}if(c=='\"'){b.Append('\\',slashes*2+1);b.Append(c);}else{b.Append('\\',slashes);b.Append(c);}slashes=0;}b.Append('\\',slashes*2);return b.Append('"').ToString();
  }
  sealed class Capture {
    public long diag=0;public int limited=0;public object sync=new object();public bool binary;public int stdoutLimit;public string failure=null;
    public void Read(IntPtr h,string file,bool isOut) { try {using(var dest=new FileStream(file,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){byte[] buffer=new byte[8192];uint n;long used=0;while(ReadFile(h,buffer,(uint)buffer.Length,out n,IntPtr.Zero)&&n>0){int keep;lock(sync){long room=isOut&&binary?stdoutLimit-used:65536-diag;keep=(int)Math.Max(0,Math.Min((long)n,room));if(!(isOut&&binary))diag+=keep;used+=keep;if(keep<n)Interlocked.Exchange(ref limited,1);}if(keep>0)dest.Write(buffer,0,keep);}dest.Flush(true);}}catch{failure="capture";Interlocked.Exchange(ref limited,1);} }
  }
  static object Run(Dictionary<string,object> command) {
    string tool=S(command,"tool");if(!new HashSet<string>{"pdfinfo","pdfdetach","pdftoppm","pdffonts"}.Contains(tool))throw new InvalidOperationException("Tool not allowed.");
    string exe=Path.Combine(tools,"Library","bin",tool+".exe");var argv=new List<string>();if(command["args"] is string)throw new InvalidOperationException("Arguments.");foreach(object arg in (IEnumerable)command["args"])argv.Add(Convert.ToString(arg));if(argv.Count>30)throw new InvalidOperationException("Arguments.");bool binary=Convert.ToBoolean(command["binary"]);if(binary&&tool!="pdftoppm")throw new InvalidOperationException("Binary mode.");
    int timeout=Convert.ToInt32(command["timeout_ms"]);if(timeout<1||timeout>30000)throw new InvalidOperationException("Timeout.");
    string prefix="command-"+(++sequence).ToString("D4"),stdout=Path.Combine(output,prefix+".stdout.part"),stderr=Path.Combine(output,prefix+".stderr.part");
    IntPtr job=IntPtr.Zero,attrs=IntPtr.Zero,handles=IntPtr.Zero,capsPtr=IntPtr.Zero,env=IntPtr.Zero;PI pi=new PI();bool assigned=false,timed=false,cancelled=false;var owned=new List<IntPtr>();var readers=new List<Thread>();var reads=new List<IntPtr>();var capture=new Capture{binary=binary,stdoutLimit=5*1024*1024};var watch=Stopwatch.StartNew();
    try {
      SA sa=new SA{length=Marshal.SizeOf(typeof(SA)),inherit=true};var writes=new List<IntPtr>();
      foreach(string target in new[]{stdout,stderr}){IntPtr r,w;Check(CreatePipe(out r,out w,ref sa,65536),"Pipe");reads.Add(r);owned.Add(w);writes.Add(w);Check(SetHandleInformation(r,1,0),"Read inheritance");bool isOut=target==stdout;IntPtr read=r;string file=target;Thread thread=new Thread(()=>capture.Read(read,file,isOut));thread.IsBackground=true;readers.Add(thread);thread.Start();}
      IntPtr stdin=CreateFileW("NUL",0x80000000,3,ref sa,3,0x80,IntPtr.Zero);Check(stdin!=IntPtr.Zero&&stdin!=new IntPtr(-1),"NUL input");owned.Add(stdin);
      job=CreateJobObjectW(IntPtr.Zero,null);Check(job!=IntPtr.Zero,"Job");EL limits=new EL();limits.basic.flags=0x100|0x200|0x2000;limits.processMemory=new UIntPtr(512u*1024u*1024u);limits.jobMemory=limits.processMemory;Check(SetInformationJobObject(job,9,ref limits,Marshal.SizeOf(typeof(EL))),"Hard memory budget");
      IntPtr n=IntPtr.Zero;InitializeProcThreadAttributeList(IntPtr.Zero,2,0,ref n);attrs=Marshal.AllocHGlobal(n);Check(InitializeProcThreadAttributeList(attrs,2,0,ref n),"Attributes");
      handles=Marshal.AllocHGlobal(IntPtr.Size*3);Marshal.WriteIntPtr(handles,0,writes[0]);Marshal.WriteIntPtr(handles,IntPtr.Size,writes[1]);Marshal.WriteIntPtr(handles,IntPtr.Size*2,stdin);Check(UpdateProcThreadAttribute(attrs,0,new IntPtr(0x20002),handles,new IntPtr(IntPtr.Size*3),IntPtr.Zero,IntPtr.Zero),"Only standard handles");
      CAP caps=new CAP{sid=sid,count=0};capsPtr=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(CAP)));Marshal.StructureToPtr(caps,capsPtr,false);Check(UpdateProcThreadAttribute(attrs,0,new IntPtr(0x20009),capsPtr,new IntPtr(Marshal.SizeOf(typeof(CAP))),IntPtr.Zero,IntPtr.Zero),"Zero capability AppContainer");
      SIX startup=new SIX();startup.si.cb=Marshal.SizeOf(typeof(SIX));startup.si.flags=0x100;startup.si.stdin=stdin;startup.si.stdout=writes[0];startup.si.stderr=writes[1];startup.attrs=attrs;
      var vars=new SortedDictionary<string,string>(StringComparer.OrdinalIgnoreCase);foreach(string name in new[]{"SystemRoot","SystemDrive","windir","USERPROFILE","LOCALAPPDATA","APPDATA","ALLUSERSPROFILE","ProgramData"}){string v=Environment.GetEnvironmentVariable(name);if(v!=null)vars[name]=v;}vars["PATH"]=Path.Combine(Environment.GetEnvironmentVariable("SystemRoot"),"System32");vars["TEMP"]=output;vars["TMP"]=output;vars["LC_ALL"]="C";vars["LANG"]="C";
      var environment=new StringBuilder();foreach(var pair in vars)environment.Append(pair.Key+"="+pair.Value+'\0');environment.Append('\0');env=Marshal.StringToHGlobalUni(environment.ToString());
      var line=new StringBuilder(Quote(exe));foreach(object arg in argv)line.Append(" "+Quote(Convert.ToString(arg)));
      Check(CreateProcessW(exe,line,IntPtr.Zero,IntPtr.Zero,true,0x80000|4|0x8000000|0x400,env,output,ref startup,out pi),"Suspended tool");foreach(IntPtr h in writes){CloseHandle(h);owned.Remove(h);}Check(AssignProcessToJobObject(job,pi.process),"Assign before resume");assigned=true;
      IntPtr token;Check(OpenProcessToken(pi.process,8,out token),"Token");int isApp=0,capCount=-1;try{int needed;IntPtr data=Marshal.AllocHGlobal(4);try{Check(GetTokenInformation(token,29,data,4,out needed),"AppContainer token");isApp=Marshal.ReadInt32(data);}finally{Marshal.FreeHGlobal(data);}GetTokenInformation(token,30,IntPtr.Zero,0,out needed);data=Marshal.AllocHGlobal(needed);try{Check(GetTokenInformation(token,30,data,needed,out needed),"Actual capabilities");capCount=Marshal.ReadInt32(data);}finally{Marshal.FreeHGlobal(data);}}finally{CloseHandle(token);}if(isApp!=1||capCount!=0)throw new InvalidOperationException("Isolation not active.");
      Check(ResumeThread(pi.thread)!=UInt32.MaxValue,"Resume");
      while(WaitForSingleObject(pi.process,10)==258){if(capture.limited!=0){Check(TerminateJobObject(job,122),"Output limit");break;}if(File.Exists(cancelFile)||!ParentAlive()){cancelled=true;Check(TerminateJobObject(job,125),"Cancel tree");break;}if(watch.ElapsedMilliseconds>=timeout){timed=true;Check(TerminateJobObject(job,124),"Timeout tree");break;}}
      Check(WaitForSingleObject(pi.process,5000)==0,"Stop tool");uint code;Check(GetExitCodeProcess(pi.process,out code),"Exit status");Check(TerminateJobObject(job,126),"Stop descendants");
      foreach(Thread reader in readers)if(!reader.Join(5000))throw new InvalidOperationException("Pipe still active.");ACC acc=new ACC();EL peak=new EL();for(int i=0;i<100;i++){Check(QueryInformationJobObject(job,1,ref acc,Marshal.SizeOf(typeof(ACC)),IntPtr.Zero),"Process accounting");if(acc.active==0)break;Thread.Sleep(10);}Check(QueryInformationJobObject(job,9,ref peak,Marshal.SizeOf(typeof(EL)),IntPtr.Zero),"Memory accounting");if(acc.active!=0||capture.failure!=null)throw new InvalidOperationException("Unsettled tool.");
      return new{type="result",index=sequence,exit_code=code,app_container=isApp==1,capabilities=capCount,active_after=acc.active,total_processes=acc.total,peak_memory=peak.peakJob.ToUInt64(),memory_limit=512*1024*1024,timeout=timed,cancelled=cancelled,output_limited=capture.limited!=0,diagnostic_bytes=capture.diag,stdout=Path.GetFileName(stdout),stderr=Path.GetFileName(stderr),elapsed_ms=watch.ElapsedMilliseconds};
    } finally {
      if(job!=IntPtr.Zero)TerminateJobObject(job,126);if(pi.process!=IntPtr.Zero&&!assigned)TerminateProcess(pi.process,127);if(pi.process!=IntPtr.Zero)WaitForSingleObject(pi.process,5000);
      foreach(IntPtr h in owned)CloseHandle(h);foreach(Thread t in readers)t.Join(5000);foreach(IntPtr h in reads)CloseHandle(h);if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);if(job!=IntPtr.Zero)CloseHandle(job);if(attrs!=IntPtr.Zero){DeleteProcThreadAttributeList(attrs);Marshal.FreeHGlobal(attrs);}foreach(IntPtr p in new[]{handles,capsPtr,env})if(p!=IntPtr.Zero)Marshal.FreeHGlobal(p);
    }
  }
  public static int Main(string[] args) {
    Console.OutputEncoding=new UTF8Encoding(false);try{
      if(args.Length<1||args.Length>2)throw new InvalidOperationException("Arguments.");Setup(args[0]);
      if(args.Length==2&&args[1]=="recover") { string stateFile=Path.Combine(control,"native-state.json");if(File.Exists(stateFile)){var state=json.Deserialize<Dictionary<string,object>>(File.ReadAllText(stateFile));if(S(state,"profile")!=profile)throw new InvalidOperationException("Profile mismatch.");if(!Convert.ToBoolean(state.ContainsKey("closed")?state["closed"]:false)&&SameProcess(Convert.ToInt32(state["helper_pid"]),Int64.Parse(S(state,"helper_started"))))throw new InvalidOperationException("Helper is still alive.");}Emit(Cleanup(true));return 0; }
      parentPid=Convert.ToInt32(cfg["parent_pid"]);using(Process parent=Process.GetProcessById(parentPid))parentStart=parent.StartTime.ToUniversalTime().Ticks;if(!ParentAlive())throw new InvalidOperationException("Parent stopped.");
      AtomicState(new{profile=profile,helper_pid=Process.GetCurrentProcess().Id,helper_started=Process.GetCurrentProcess().StartTime.ToUniversalTime().Ticks.ToString(),closed=false,initialized=false});
      int hr=CreateAppContainerProfile(profile,"Manual PDF local task","Temporary isolated manual PDF generation",IntPtr.Zero,0,out sid);if(hr!=0)throw new InvalidOperationException("Profile creation failed.");created=true;
      foreach(string dir in new[]{tools,input,output}){Acl(dir,true);granted.Add(dir);}DenyProfileWrites(true);
      Emit(new{type="ready",profile=profile,pid=Process.GetCurrentProcess().Id,capabilities=0});
      string line;while((line=Console.ReadLine())!=null){if(line.Length>32768)throw new InvalidOperationException("Command size.");var command=json.Deserialize<Dictionary<string,object>>(line);if(command.ContainsKey("close"))break;if(File.Exists(cancelFile)||!ParentAlive())break;Emit(Run(command));}
      return 0;
    } catch(Exception) { Emit(new{type="error",message="Native PDF task could not complete."});return 1; }
    finally { if(created){try{Emit(Cleanup(false));}catch{Emit(new{type="closed",cleanup=false});}}if(sid!=IntPtr.Zero)FreeSid(sid); }
  }
}
