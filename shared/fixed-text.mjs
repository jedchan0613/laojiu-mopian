import ja from './messages.ja.json' with {type:'json'};
import ko from './messages.ko.json' with {type:'json'};
import hant from './messages.zh-Hant.json' with {type:'json'};
import traditionalSource from './messages.zh-Hant-source.json' with {type:'json'};
import {thaiText} from './thai-text.mjs';
import {normalizeLocale} from './locale-config.mjs';
const messages={ja,ko,'zh-Hant':hant};
export const fixedTemplates=[
 [/^View the Laojiu Mopian (.+) account and QR code$/,'View the Laojiu Mopian {0} account and QR code'],
 [/^Enlarge the Laojiu Mopian (.+) QR code$/,'Enlarge the Laojiu Mopian {0} QR code'],
 [/^Laojiu Mopian (.+) QR code$/,'Laojiu Mopian {0} QR code'],
 [/^Open the QR code or search for the account on (.+)\.$/,'Open the QR code or search for the account on {0}.'],
 [/^(.+) account details pending$/,'{0} account details pending'],
 [/^Wait (\d+) seconds before requesting another code\.$/,'Wait {0} seconds before requesting another code.'],
 [/^Too many requests\. Try again in (\d+) seconds\.$/,'Too many requests. Try again in {0} seconds.'],
 [/^Incorrect code\. (\d+) attempts remain\.$/,'Incorrect code. {0} attempts remain.'],
 [/^Keep your nickname within (\d+) characters\.$/,'Keep your nickname within {0} characters.'],
 [/^The limit of (\d+) favorites has been reached\. Remove some favorites first\.$/,'The limit of {0} favorites has been reached. Remove some favorites first.'],
];
// 只翻译固定界面和明确模板，捕获的昵称、平台名等插入值保持原文。
export const fixedText=(text,locale,sourceText=text)=>{
 const language=normalizeLocale(locale);
 if(language==='zh-CN')return sourceText;
 if(language==='en')return text;
 if(language==='th')return thaiText(text);
 if(language==='zh-Hant'&&Object.hasOwn(traditionalSource,sourceText))return traditionalSource[sourceText];
 const dictionary=messages[language];
 if(Object.hasOwn(dictionary,text))return dictionary[text];
 for(const [pattern,key]of fixedTemplates){const match=text.match(pattern);if(match&&Object.hasOwn(dictionary,key))return dictionary[key].replace('{0}',match[1]);}
 return language==='zh-Hant'?sourceText:text;
};
