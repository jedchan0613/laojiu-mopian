import type { ArchiveItem } from './archive-schema';

// 本文件由本地档案管理入口根据 archive-data 中通过发布检查的记录生成。
// 原始主档、完整私人地址、完整号码、签名和指纹不得写入这里。
export const archiveItems = [
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PCD-001",
			"object_type": "PCD",
			"title": "富士山下的新年祝福",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PCD-001/front-public.jpg",
				"/archive/LJM-20260808-PCD-001/back-public.jpg"
			],
			"collection_code": "PCD_1960_PHO_GRT_MEM+DLY_UNK_MAI",
			"accession_date": "2026-08-08",
			"batch_id": "FSA-20260808-CCQ",
			"date_display": "1960",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "闲鱼老板",
			"source_place": "北京",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-01",
			"updated_date": "2026-09-26",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-PHO"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": "PU-MAI"
				},
				"PC04": {
					"writing_date": "1960-01-01",
					"writing_date_text": "19600101"
				},
				"PC12": {
					"image_subject": "富士山下的新年祝福"
				},
				"PC07": {
					"dispatch_place": [
						"日本大阪"
					]
				},
				"PC11": {
					"correspondence_relationship": [
						"未知"
					]
				},
				"PC18": {
					"stamp_status": [
						"未知"
					]
				}
			}
		},
		"public_view": {
			"description": "从富士山下  到一句新年快乐",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"image_descriptions": [
				"照片明信片正面，照片与新年贺词并列。",
				"照片明信片背面，手写文字与年份标记。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-001",
			"object_type": "PHO",
			"title": "海滩嬉戏",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-001/front-public.jpg"
			],
			"collection_code": "PHO_1990_MEM_MEM_NONE_C0+FAD_G",
			"accession_date": "2026-08-08",
			"batch_id": "FSA-20260808-CCQ",
			"date_display": "1990",
			"physical_location": "未知",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "旧货市场",
			"verso_types": [
				"VS-NONE"
			],
			"carrier": "MT-PPR",
			"color": "CL-COL",
			"process": "PC-AG",
			"mark_types": [
				"MK-NONE"
			],
			"scan_date": "2026-08-20",
			"scan_ppi": 600,
			"backup_status": "BU0",
			"event_scene": [
				"EV-TRV",
				"EV-DLY"
			],
			"photo_function": "FN-MEM",
			"shot_form": "FM-GRP",
			"photography_source": "PS-PER",
			"condition_grade": "C0",
			"source_date": "2026-08-08",
			"created_date": "2026-08-29",
			"updated_date": "2026-09-26",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"themes": [
				"SU-MEM"
			],
			"condition_details": [
				"DM-FAD"
			],
			"date_start": "1998-02-01",
			"date_end": "2004-01-01",
			"country": "中国",
			"specific_place": "海滩"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D09": {
					"photography_source": "PS-PER"
				}
			}
		},
		"public_view": {
			"description": "那年海风很轻，笑声还没有被时间带走。",
			"transcription": "",
			"tags": [
				"生活"
			],
			"image_descriptions": [
				"海滩上的人物与海面，照片保留原有色调。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-002",
			"accession_date": "2026-08-08",
			"object_type": "PHO",
			"title": "80年代末的珠海",
			"date_display": "1989",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-002/front-public.jpg",
				"/archive/LJM-20260808-PHO-002/back-public.jpg",
				"/archive/LJM-20260808-PHO-002/detail-01-public.jpg",
				"/archive/LJM-20260808-PHO-002/detail-02-public.jpg",
				"/archive/LJM-20260808-PHO-002/detail-03-public.jpg"
			],
			"collection_code": "PHO_1989_MEM_OTH_NONE_C2+FAD_G",
			"batch_id": "FSA-20260808-CCQ",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "佛山护红巷",
			"date_start": "1986-01-01",
			"date_end": "1989-12-31",
			"time_notes": "AI",
			"province": "广东省",
			"city": "珠海市",
			"country": "中国",
			"district": "香洲区",
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-COL",
			"process": "PC-AG",
			"source_date": "2026-08-08",
			"condition_grade": "C2",
			"condition_details": [
				"DM-FAD"
			],
			"scan_ppi": 600,
			"created_date": "2026-08-30",
			"updated_date": "2026-09-26",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-OTH"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				},
				"D08": {
					"shot_form": "FM-BLD"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "档案年代标注为1989年。五张照片呈现珠海的街道、建筑与远处景象。",
			"transcription": "",
			"tags": [
				"珠海"
			],
			"image_descriptions": [
				"第一张照片：道路、树木与远处的建筑。",
				"第二张照片：道路两侧的楼房与路上行人。",
				"第三张照片：地面、远处山地与天空。",
				"第四张照片：街道旁的多层建筑。",
				"第五张照片：街道、楼房与骑车行人。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PST-001",
			"batch_id": "FSA-20260808-CCQ",
			"accession_date": "2026-08-08",
			"object_type": "PST",
			"item_seq": 1,
			"title": "一张从日本寄出的旧明信片照片",
			"date_display": "1979",
			"city": "哈尔滨",
			"place_notes": "用户确认寄出地为日本东京，收件地为哈尔滨。",
			"people": [
				"王同志"
			],
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场/闲鱼",
			"source_place": "哈尔滨旧货市场",
			"provenance_notes": "哈尔滨旧货市场老板（闲鱼）购入",
			"related_item_ids": [
				"LJM-20260827-LET-001"
			],
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "A",
			"evidence_basis": "用户提供并确认的公开元数据。",
			"digitization_status": "DG3",
			"transcription_status": "TX2",
			"backup_status": "BU0",
			"publication_file_path": [
				"/archive/LJM-20260808-PST-001/front-public.jpg",
				"/archive/LJM-20260808-PST-001/back-public.jpg"
			],
			"use_status": "U3",
			"created_date": "2026-08-27",
			"updated_date": "2026-09-26",
			"next_action": "无；本次合并、正式构建和页面文件检查已完成。",
			"notes": "原编号 LJM-20260827-LET-001 的信件实际为本件明信片的附属信件，现已连同两张发布图片并入本主档。用户此前已确认附属信件的收件称呼、落款和通信内容允许公开且无需遮盖。",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"physical_location": "哈尔滨",
			"collection_code": "PST_1979_VIEW_COM_MEM+FST_UNK_MAI",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			]
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-VIEW"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC06": {
					"image_place_text": [
						"富士山"
					]
				},
				"PC07": {
					"dispatch_place": [
						"日本"
					]
				},
				"PC10": {
					"recipient_name": [
						"孙志坚先生"
					]
				},
				"PC12": {
					"image_subject": "富士山风景"
				},
				"PC20": {
					"language": [
						"zh"
					],
					"script": [
						"汉字"
					],
					"message_transcription": "赠 孙志坚先生"
				},
				"PC21": {
					"postcard_use": "PU-MAI"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC04": {
					"writing_date": "1979-06-01"
				},
				"PC11": {
					"correspondence_relationship": [
						"朋友"
					]
				},
				"PC18": {
					"stamp_country": [
						"无邮票"
					]
				}
			}
		},
		"public_view": {
			"description": "一张保存较完整的旧明信片，正面为富士山风景，背面保留手写文字。",
			"transcription": "赠 孙志坚先生",
			"tags": [
				"明信片",
				"东北",
				"1970年代"
			],
			"image_descriptions": [
				"明信片正面，富士山与山下建筑的风景。",
				"明信片背面，手写赠语与日期标记。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PST-002",
			"object_type": "PST",
			"title": "天鹅好肥",
			"privacy_level": "G",
			"rights_status": "OWN",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PST-002/front-public.jpg",
				"/archive/LJM-20260808-PST-002/back-public.jpg"
			],
			"collection_code": "PST_2013_VIEW_TRV_MEM+TRV_UNK_MAI",
			"accession_date": "2026-08-08",
			"batch_id": "FSA-20260808-CCQ",
			"date_display": "2013",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_place": "天光墟旧货市场",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-MEM"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-01",
			"updated_date": "2026-09-26",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-VIEW"
				},
				"PC02": {
					"postcard_function": "PF-TRV"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": "PU-MAI"
				},
				"PC07": {
					"dispatch_place": [
						"列支敦士登"
					]
				},
				"PC12": {
					"image_subject": "旅行"
				},
				"PC04": {
					"writing_date": "2013-12-09",
					"writing_date_text": "20131209"
				},
				"PC11": {
					"correspondence_relationship": [
						"未知"
					]
				},
				"PC18": {
					"stamp_status": [
						"未知"
					]
				}
			}
		},
		"public_view": {
			"description": "一张标注为2013年的明信片，发布副本分别展示手写留言面与山地风景面。",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"image_descriptions": [
				"明信片留言面，手写文字、邮政印记与条形码。",
				"明信片风景面，山地与建筑景色。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260828-PHO-001",
			"accession_date": "2026-08-28",
			"object_type": "PCD",
			"title": "历史的笑容",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260828-PHO-001/front-public.jpg"
			],
			"physical_location": "佛山",
			"created_date": "2026-08-28",
			"updated_date": "2026-09-26",
			"batch_id": "FSA-202628-CCQ",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"acquisition_method": "PR-PUR",
			"date_display": "1992",
			"source_place": "东北",
			"collection_code": "PCD_1992_COM_COL_MEM+OTH_OTH_MAI",
			"country": "俄罗斯",
			"event_scene": [
				"EV-OTH"
			],
			"themes": [
				"SU-MEM"
			]
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-COM"
				},
				"PC02": {
					"postcard_function": "PF-COL"
				},
				"PC04": {
					"writing_date": "1992-01-01"
				},
				"PC07": {
					"dispatch_place": [
						"俄罗斯"
					]
				},
				"PC19": {
					"postal_mark_types": [
						"PM-OTH"
					]
				},
				"PC21": {
					"postcard_use": "PU-MAI"
				},
				"PC06": {
					"image_place_code": [
						"俄罗斯"
					]
				},
				"PC11": {
					"correspondence_relationship": [
						"未知"
					]
				},
				"PC18": {
					"stamp_status": [
						"未知"
					]
				}
			}
		},
		"public_view": {
			"description": "一张带有邮票和邮戳的照片卡片，画面为两位人物合影。档案年代标注为1992年。",
			"transcription": "",
			"tags": [
				"历史",
				"苏联"
			],
			"image_descriptions": [
				"照片卡片正面，人物合影与邮票、邮戳。"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260909-ALB-001",
			"title": "哈工大家庭岁月",
			"object_type": "ALB",
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"accession_date": "2026-09-09",
			"physical_location": "佛山",
			"date_display": "年代未知",
			"privacy_level": "G",
			"use_status": "U3",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"evidence_basis": "所有人确认同一册及购入、存放信息；未提供整册封面、原页次或整体年代，不从部分照片推定整册年代。",
			"acquisition_method": "PR-PUR",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"publication_file_path": [
				"/archive/LJM-20260909-ALB-001/front-public.jpg"
			],
			"themes": [
				"SU-MEM",
				"SU-CHD"
			],
			"carrier": "MT-UNK",
			"color": "CL-UNK",
			"process": "PC-UNK",
			"research_notes": "本册按55个独立标题文件夹分件，共99幅照片；未提供实物封面，所有人批准使用由发布副本制作的册内影像选览图。选览图不代表实物封面或原始排版。",
			"last_research_date": "2026-10-15",
			"next_action": "补录实物封面、保存状况与页码。",
			"specific_place": "整册地点待核；分件地点见照片档案",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "ALB_年代未知_MEM+CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "《哈工大家庭岁月》收录55件（组）照片档案，共99幅影像，内容包括游览留影、室内相聚和儿童日常。相册题名由收藏者提供，人物身份、职业及亲属关系尚未核实。部分照片可辨北京地点；其余地点和整册拍摄年代仍待考。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。\n本页代表图为册内影像选览，非实物封面。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"相册",
				"人物影像"
			],
			"image_descriptions": [
				"册内影像选览，非实物封面。选取6幅发布副本组成，不代表原册页序。"
			]
		}
	},
	{
		"core": {
			"title": "白衬衫与花纹衬衫女子结伴游览小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-001/front-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-02-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-03-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-04-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-05-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-06-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-07-public.jpg",
				"/archive/LJM-20260909-PHO-001/detail-08-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。第1图门额“北京动物园”为地点A级证据，并用S1核对；日期未知，整体证据等级保守为D。",
			"last_research_date": "2026-10-15",
			"country": "中国",
			"province": "北京市",
			"city": "北京市",
			"specific_place": "北京动物园（仅本组第1图已确认）",
			"place_notes": "第1图门额可辨“北京动物园”，地点A级直接证据；其余8图地点未逐幅确认，不统一写成动物园。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-001",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组9幅黑白照片，作为一件照片档案保留。内容包括北京动物园门前双人合影、室内并坐的两位女子、彩绘建筑前的两位女子、亭前戴墨镜的两位女子、建筑门口游览合影、花坛旁戴墨镜的两位女子、假山洞口三人合影、树下撑伞的两位女子、两位女子手持西瓜的近景。本组第1幅可确认在北京动物园门前，其余画面地点待核。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "第1图门额：北京动物园。第3图建筑匾额未完整辨清，不作完整转录。",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：北京动物园门前双人合影。",
				"第2幅：室内并坐的两位女子。",
				"第3幅：彩绘建筑前的两位女子。",
				"第4幅：亭前戴墨镜的两位女子。",
				"第5幅：建筑门口游览合影。",
				"第6幅：花坛旁戴墨镜的两位女子。",
				"第7幅：假山洞口三人合影。",
				"第8幅：树下撑伞的两位女子。",
				"第9幅：两位女子手持西瓜的近景。"
			]
		}
	},
	{
		"core": {
			"title": "草地边喝奶瓶的幼童",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-002/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-002",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。草地边喝奶瓶的幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：草地边喝奶瓶的幼童。"
			]
		}
	},
	{
		"core": {
			"title": "城楼广场与桥栏前的结伴留影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-003/front-public.jpg",
				"/archive/LJM-20260909-PHO-003/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-003/detail-02-public.jpg",
				"/archive/LJM-20260909-PHO-003/detail-03-public.jpg",
				"/archive/LJM-20260909-PHO-003/detail-04-public.jpg",
				"/archive/LJM-20260909-PHO-003/detail-05-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。第3、4图天安门特征与S2互证，地点B级；日期未知，整体证据等级保守为D。",
			"last_research_date": "2026-10-15",
			"country": "中国",
			"province": "北京市",
			"city": "北京市",
			"specific_place": "天安门前、天安门广场一带（第3、4图）",
			"place_notes": "第3、4图可见天安门城楼、国徽及标语，与S2核对。其余图不扩展为具体宫殿或博物馆；本组地点只代表已确证画面。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-003",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组6幅黑白照片，作为一件照片档案保留。内容包括传统建筑台阶与石栏前的两位女子、夏装女子同行留影、天安门前两位女子合影、天安门前女子独照、广场上戴墨镜的女子、栏杆旁并坐的两位女子。第3、4幅可辨天安门城楼；同组其余画面的具体地点保留待核。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "第4图：中华人民共和国万岁；世界人民大团结万岁。",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：传统建筑台阶与石栏前的两位女子。",
				"第2幅：夏装女子同行留影。",
				"第3幅：天安门前两位女子合影。",
				"第4幅：天安门前女子独照。",
				"第5幅：广场上戴墨镜的女子。",
				"第6幅：栏杆旁并坐的两位女子。"
			]
		}
	},
	{
		"core": {
			"title": "穿条纹背心的婴幼儿头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-004/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-004",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。穿条纹背心的婴幼儿头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：穿条纹背心的婴幼儿头像。"
			]
		}
	},
	{
		"core": {
			"title": "戴帽幼童与推车小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-005/front-public.jpg",
				"/archive/LJM-20260909-PHO-005/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-005/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-005",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括戴帽幼童坐姿、戴帽幼童抬手一瞬、推车里的浅色帽装幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：戴帽幼童坐姿。",
				"第2幅：戴帽幼童抬手一瞬。",
				"第3幅：推车里的浅色帽装幼童。"
			]
		}
	},
	{
		"core": {
			"title": "电视机与人物海报旁的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "约1980年代",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "C",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-006/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。画面有旋钮式显像管电视机、人物挂历及高领针织服饰；挂历数字被遮挡且印刷风格不清，不能完整读成年份。综合设备形态和服饰提出1980年代线索，但设备可能沿用。年代等级C，待用户核对；图中挂历未用于精确日期。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "画面有旋钮式显像管电视机、人物挂历及高领针织服饰；挂历数字被遮挡且印刷风格不清，不能完整读成年份。综合设备形态和服饰提出1980年代线索，但设备可能沿用。属于低置信推测，不是确切年份；不填写精确日期。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-006",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_约1980年代_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。电视机与人物海报旁的女子。拍摄年代暂建议约1980年代，依据设备与服饰作推测，尚待核实。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：电视机与人物海报旁的女子。"
			]
		}
	},
	{
		"core": {
			"title": "短发女子证件式头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-007/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-007",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。短发女子证件式头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：短发女子证件式头像。"
			]
		}
	},
	{
		"core": {
			"title": "发箍女子侧望头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-008/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-008",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。发箍女子侧望头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：发箍女子侧望头像。"
			]
		}
	},
	{
		"core": {
			"title": "翻领上衣男子半身头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-009/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-009",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。翻领上衣男子半身头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：翻领上衣男子半身头像。"
			]
		}
	},
	{
		"core": {
			"title": "高领衫女子微笑近照",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-010/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-010",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。高领衫女子微笑近照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：高领衫女子微笑近照。"
			]
		}
	},
	{
		"core": {
			"title": "高领衫女子与幼童居家近影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-011/front-public.jpg",
				"/archive/LJM-20260909-PHO-011/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-011/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-011",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括床边成人与幼童合影、室内女子抱幼童、女子与微笑幼童近照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：床边成人与幼童合影。",
				"第2幅：室内女子抱幼童。",
				"第3幅：女子与微笑幼童近照。"
			]
		}
	},
	{
		"core": {
			"title": "黑色高领衫男子与幼童的围桌片刻",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-012/front-public.jpg",
				"/archive/LJM-20260909-PHO-012/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-012/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-012",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括黑色高领衫男子进餐一瞬、成人与花纹上衣幼童近照、餐桌前的成人与幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：黑色高领衫男子进餐一瞬。",
				"第2幅：成人与花纹上衣幼童近照。",
				"第3幅：餐桌前的成人与幼童。"
			]
		}
	},
	{
		"core": {
			"title": "黑色高领衫女子居家小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-013/front-public.jpg",
				"/archive/LJM-20260909-PHO-013/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-013",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括黑色高领衫女子与幼童、床边微笑的黑色高领衫女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：黑色高领衫女子与幼童。",
				"第2幅：床边微笑的黑色高领衫女子。"
			]
		}
	},
	{
		"core": {
			"title": "湖边四人合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-014/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-014",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。湖边四人合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：湖边四人合影。"
			]
		}
	},
	{
		"core": {
			"title": "湖畔拱桥双人影像小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-015/front-public.jpg",
				"/archive/LJM-20260909-PHO-015/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。两幅构图接近但清晰度和取景有差异，无法确认同一曝光或连续拍摄，全部保留，不去重。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-015",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括湖边夏装双人合影、水边并肩站立的一男一女。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：湖边夏装双人合影。",
				"第2幅：水边并肩站立的一男一女。"
			]
		}
	},
	{
		"core": {
			"title": "花丛旁女子抱幼童",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-016/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-016",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。花丛旁女子抱幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：花丛旁女子抱幼童。"
			]
		}
	},
	{
		"core": {
			"title": "花木旁低头的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-017/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-017",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。花木旁低头的女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：花木旁低头的女子。"
			]
		}
	},
	{
		"core": {
			"title": "花木旁回望的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-018/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-018",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。花木旁回望的女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：花木旁回望的女子。"
			]
		}
	},
	{
		"core": {
			"title": "花坛边女子与幼童合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-019/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-019",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。花坛边女子与幼童合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：花坛边女子与幼童合影。"
			]
		}
	},
	{
		"core": {
			"title": "花纹上衣婴儿笑脸",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-020/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-020",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。花纹上衣婴儿笑脸。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：花纹上衣婴儿笑脸。"
			]
		}
	},
	{
		"core": {
			"title": "假山旁白衬衫女子坐像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-021/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-021",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。假山旁白衬衫女子坐像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：假山旁白衬衫女子坐像。"
			]
		}
	},
	{
		"core": {
			"title": "林荫路幼童三轮车小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-022/front-public.jpg",
				"/archive/LJM-20260909-PHO-022/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-022",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括林荫路上骑三轮车的幼童、林荫路上三轮车迎面留影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：林荫路上骑三轮车的幼童。",
				"第2幅：林荫路上三轮车迎面留影。"
			]
		}
	},
	{
		"core": {
			"title": "楼前路边的幼童",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-023/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-023",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。楼前路边的幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：楼前路边的幼童。"
			]
		}
	},
	{
		"core": {
			"title": "楼前四位成人与幼童合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-024/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-024",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。楼前四位成人与幼童合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：楼前四位成人与幼童合影。"
			]
		}
	},
	{
		"core": {
			"title": "楼梯扶手旁的女子坐像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-025/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-025",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。楼梯扶手旁的女子坐像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：楼梯扶手旁的女子坐像。"
			]
		}
	},
	{
		"core": {
			"title": "录音机旁的女子与幼童相聚",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "约1980年代",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "C",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-026/front-public.jpg",
				"/archive/LJM-20260909-PHO-026/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-026/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。第2、3图可见卡式收录机，结合室内陈设、服饰提出1980年代线索；S3仅提供同期收录机使用的背景。第2图挂历年份模糊，不能据此定年，设备也可能延用。年代等级C，待用户核对；图中挂历未用于精确日期。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "第2、3图可见卡式收录机，结合室内陈设、服饰提出1980年代线索；S3仅提供同期收录机使用的背景。第2图挂历年份模糊，不能据此定年，设备也可能延用。属于低置信推测，不是确切年份；不填写精确日期。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-026",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_约1980年代_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括室内女子幼童与圆球、音响旁女子与幼童合影、录音机旁女子抱幼童。拍摄年代暂建议约1980年代，依据设备与服饰作推测，尚待核实。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：室内女子幼童与圆球。",
				"第2幅：音响旁女子与幼童合影。",
				"第3幅：录音机旁女子抱幼童。"
			]
		}
	},
	{
		"core": {
			"title": "路边抱婴儿的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-027/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-027",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。路边抱婴儿的女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：路边抱婴儿的女子。"
			]
		}
	},
	{
		"core": {
			"title": "木栏旁白衣女子坐像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-028/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-028",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。木栏旁白衣女子坐像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"游览留影"
			],
			"image_descriptions": [
				"第1幅：木栏旁白衣女子坐像。"
			]
		}
	},
	{
		"core": {
			"title": "浅色开衫与深色领巾女子小像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-029/front-public.jpg",
				"/archive/LJM-20260909-PHO-029/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-029",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括楼前系围巾的女子、室内穿开衫的女子半身照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：楼前系围巾的女子。",
				"第2幅：室内穿开衫的女子半身照。"
			]
		}
	},
	{
		"core": {
			"title": "浅色外衣幼童与布娃娃游戏小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-030/front-public.jpg",
				"/archive/LJM-20260909-PHO-030/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-030/detail-02-public.jpg",
				"/archive/LJM-20260909-PHO-030/detail-03-public.jpg",
				"/archive/LJM-20260909-PHO-030/detail-04-public.jpg",
				"/archive/LJM-20260909-PHO-030/detail-05-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-030",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组6幅黑白照片，作为一件照片档案保留。内容包括亲吻布娃娃的幼童、窗帘前抱布娃娃的幼童、抱布娃娃并手持圆形物件的幼童、床上拿着圆物的幼童、窗帘前幼童与布娃娃笑脸、柜前握奶瓶微笑的幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：亲吻布娃娃的幼童。",
				"第2幅：窗帘前抱布娃娃的幼童。",
				"第3幅：抱布娃娃并手持圆形物件的幼童。",
				"第4幅：床上拿着圆物的幼童。",
				"第5幅：窗帘前幼童与布娃娃笑脸。",
				"第6幅：柜前握奶瓶微笑的幼童。"
			]
		}
	},
	{
		"core": {
			"title": "浅色无袖上衣幼童张臂近照",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-031/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-031",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。浅色无袖上衣幼童张臂近照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：浅色无袖上衣幼童张臂近照。"
			]
		}
	},
	{
		"core": {
			"title": "浅水边站立的两位成人",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-032/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "船身文字可辨“牡青客512”，但尚未找到足够证据确认航线或拍摄地点；不直接填写牡丹江、镜泊湖或哈尔滨。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM",
				"SU-TRN"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。船身文字是画面内容，不是照片背章或照相馆印记。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-032",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM+TRN_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。浅水边站立的两位成人。背景船身可辨“牡青客512”，目前仅转录，不据此确定地点。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "船身可辨：牡青客 512。",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：浅水边站立的两位成人。"
			]
		}
	},
	{
		"core": {
			"title": "深色滚边领口女子微笑头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-033/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-033",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。深色滚边领口女子微笑头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：深色滚边领口女子微笑头像。"
			]
		}
	},
	{
		"core": {
			"title": "深色帘前的成人与幼童合影小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-034/front-public.jpg",
				"/archive/LJM-20260909-PHO-034/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-034/detail-02-public.jpg",
				"/archive/LJM-20260909-PHO-034/detail-03-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-034",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组4幅黑白照片，作为一件照片档案保留。内容包括深色帘前西装男子与女子合影、深色帘前西装男子与戴眼镜女子、深色帘前两位成人近照、室内成人与幼童三人合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：深色帘前西装男子与女子合影。",
				"第2幅：深色帘前西装男子与戴眼镜女子。",
				"第3幅：深色帘前两位成人近照。",
				"第4幅：室内成人与幼童三人合影。"
			]
		}
	},
	{
		"core": {
			"title": "深色绒背心幼童近照小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-035/front-public.jpg",
				"/archive/LJM-20260909-PHO-035/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-035",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括床栏旁的深色背心幼童、穿深色背心的幼童头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：床栏旁的深色背心幼童。",
				"第2幅：穿深色背心的幼童头像。"
			]
		}
	},
	{
		"core": {
			"title": "室内并坐的一男一女",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-036/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-036",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。室内并坐的一男一女。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：室内并坐的一男一女。"
			]
		}
	},
	{
		"core": {
			"title": "室内穿纽扣上衣的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-037/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-037",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。室内穿纽扣上衣的女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：室内穿纽扣上衣的女子。"
			]
		}
	},
	{
		"core": {
			"title": "室内高领衫女子与男子并坐小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-038/front-public.jpg",
				"/archive/LJM-20260909-PHO-038/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-038",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括室内并肩坐着的两位成人、室内低头女子与男子近照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：室内并肩坐着的两位成人。",
				"第2幅：室内低头女子与男子近照。"
			]
		}
	},
	{
		"core": {
			"title": "室内两位女子合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-039/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-039",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。室内两位女子合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：室内两位女子合影。"
			]
		}
	},
	{
		"core": {
			"title": "室内三人亲密近照",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-040/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-040",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。室内三人亲密近照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：室内三人亲密近照。"
			]
		}
	},
	{
		"core": {
			"title": "室内托腮的女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-041/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-041",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。室内托腮的女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：室内托腮的女子。"
			]
		}
	},
	{
		"core": {
			"title": "树旁吃东西的儿童小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-042/front-public.jpg",
				"/archive/LJM-20260909-PHO-042/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-042",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括空地上拿着食物的儿童、树旁拿着食物的儿童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：空地上拿着食物的儿童。",
				"第2幅：树旁拿着食物的儿童。"
			]
		}
	},
	{
		"core": {
			"title": "树旁扶自行车的男子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-043/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-043",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。树旁扶自行车的男子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：树旁扶自行车的男子。"
			]
		}
	},
	{
		"core": {
			"title": "树旁三位成人侧向合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-044/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-044",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。树旁三位成人侧向合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：树旁三位成人侧向合影。"
			]
		}
	},
	{
		"core": {
			"title": "树下撑花伞的深色裙装女子",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-045/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-045",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。树下撑花伞的深色裙装女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：树下撑花伞的深色裙装女子。"
			]
		}
	},
	{
		"core": {
			"title": "抬手微笑的条纹衫幼童",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-046/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-046",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。抬手微笑的条纹衫幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：抬手微笑的条纹衫幼童。"
			]
		}
	},
	{
		"core": {
			"title": "抬头大笑的女子半身照",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-047/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-047",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。抬头大笑的女子半身照。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：抬头大笑的女子半身照。"
			]
		}
	},
	{
		"core": {
			"title": "条纹翻领衫女子微笑头像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-048/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-048",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。条纹翻领衫女子微笑头像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：条纹翻领衫女子微笑头像。"
			]
		}
	},
	{
		"core": {
			"title": "条纹衫卷发女子侧望肖像",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-049/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-POR"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-049",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。条纹衫卷发女子侧望肖像。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：条纹衫卷发女子侧望肖像。"
			]
		}
	},
	{
		"core": {
			"title": "推车里扶着把手的幼童",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-050/front-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-050",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一幅黑白照片。推车里扶着把手的幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：推车里扶着把手的幼童。"
			]
		}
	},
	{
		"core": {
			"title": "围桌交谈与饮茶小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-051/front-public.jpg",
				"/archive/LJM-20260909-PHO-051/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-051/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。本组含多种人数或构图，以FM-OTH保留混合性质，各幅另有说明。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-051",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-OTH"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括餐桌边三位成人、围桌交谈的两位成人、桌边手持杯子的两位成人。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"室内生活"
			],
			"image_descriptions": [
				"第1幅：餐桌边三位成人。",
				"第2幅：围桌交谈的两位成人。",
				"第3幅：桌边手持杯子的两位成人。"
			]
		}
	},
	{
		"core": {
			"title": "细树旁坐着的幼童小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-052/front-public.jpg",
				"/archive/LJM-20260909-PHO-052/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-CHD"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-052",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_CHD_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括树旁抓着树干的幼童、树边坐着的幼童。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像",
				"儿童"
			],
			"image_descriptions": [
				"第1幅：树旁抓着树干的幼童。",
				"第2幅：树边坐着的幼童。"
			]
		}
	},
	{
		"core": {
			"title": "雪地砖楼前冬装双人合影",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-053/front-public.jpg",
				"/archive/LJM-20260909-PHO-053/detail-01-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-053",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组2幅黑白照片，作为一件照片档案保留。内容包括砖楼前冬装双人合影、雪地树旁一男一女合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：砖楼前冬装双人合影。",
				"第2幅：雪地树旁一男一女合影。"
			]
		}
	},
	{
		"core": {
			"title": "长椅与围栏旁的夏装双人小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-054/front-public.jpg",
				"/archive/LJM-20260909-PHO-054/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-054/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-WOM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-054",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_WOM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括长椅上交谈的两位女子、长椅上相视的两位女子、围栏旁并肩的两位女子。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：长椅上交谈的两位女子。",
				"第2幅：长椅上相视的两位女子。",
				"第3幅：围栏旁并肩的两位女子。"
			]
		}
	},
	{
		"core": {
			"title": "砖楼前的同行合影小组",
			"accession_date": "2026-09-09",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R3",
			"evidence_level": "D",
			"digitization_status": "DG3",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-PHO-055/front-public.jpg",
				"/archive/LJM-20260909-PHO-055/detail-01-public.jpg",
				"/archive/LJM-20260909-PHO-055/detail-02-public.jpg"
			],
			"batch_id": "LJM-20260909-B01",
			"album_id": "LJM-A20260909-01",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"evidence_basis": "逐图复核本批扫描画面：照片边缘/纸面及黑白影像可见；场景、构图和服饰只按画面描述，不识别人名或职业。拍摄年代无可靠直接证据，整条记录保守使用D；可见画面字段的依据另列。",
			"last_research_date": "2026-10-15",
			"specific_place": "地点未知",
			"place_notes": "未见可确认的拍摄地文字或独特地标；不根据相册题名填写哈尔滨或哈尔滨工业大学。",
			"time_notes": "未见可读的拍摄日期；不用文件修改日期或购入日期代替。",
			"event_scene": [
				"EV-DLY"
			],
			"themes": [
				"SU-MEM"
			],
			"carrier": "MT-PPR",
			"color": "CL-BW",
			"process": "PC-UNK",
			"provenance_notes": "档案所有人确认本批全部出自《哈工大家庭岁月》，2026-09-09购入。题名为所有人提供，不作为人物单位、身份或拍摄地点的确证。",
			"research_notes": "未提供照片背面和原册页码；不把整理目录顺序当成相册原始页序。人物姓名、身份、亲属关系、拍摄单位均未确认。保存等级与完整背面信息待实物核对；没有未知代码的缺项经所有人批准如实公开，不造码、不填写“无”。",
			"next_action": "待补照片背面、原册页序、实物尺寸及保存状况；有新证据时更新年代地点。",
			"filename_notes": "front为该组第一幅正面，detail-NN为组内其余照片正面；不是同一张照片的背面或裁切细节。",
			"size_notes": "未提供实物尺寸，像素尺寸不换算为照片毫米尺寸。",
			"item_id": "LJM-20260909-PHO-055",
			"created_date": "2026-10-15",
			"updated_date": "2026-10-15",
			"collection_code": "PHO_年代未知_MEM_UNK_G",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-UNK"
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D09": {
					"photography_source": "PS-UNK"
				},
				"D13": {
					"mark_types": [
						"MK-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一组3幅黑白照片，作为一件照片档案保留。内容包括砖楼前条纹衫女子与男子合影、砖楼前白衣女子与条纹衫女子、砖楼前两位女子靠近合影。同属相册《哈工大家庭岁月》。\n资料说明：照片背面未提供，实物保存状态待核；原册页序未记录。",
			"transcription": "",
			"tags": [
				"哈工大家庭岁月",
				"人物影像"
			],
			"image_descriptions": [
				"第1幅：砖楼前条纹衫女子与男子合影。",
				"第2幅：砖楼前白衣女子与条纹衫女子。",
				"第3幅：砖楼前两位女子靠近合影。"
			]
		}
	},
	{
		"core": {
			"title": "“爸爸您好”，比新年快乐更久",
			"accession_date": "2026-10-11",
			"object_type": "LET",
			"date_display": "1993年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-LET-001/front-public.jpg",
				"/archive/LJM-20261011-LET-001/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-LET-001",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "LET_1993年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1993 年的一张贺卡。祝词都很普通，开头那个称呼，让纸忽然有了温度。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1993年写给父亲的新年贺卡，背面。",
				"1993年写给父亲的新年贺卡，封面/正面。"
			]
		}
	},
	{
		"core": {
			"title": "信里没有远方，只有惦记",
			"accession_date": "2026-10-11",
			"object_type": "LET",
			"date_display": "1993年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-LET-002/front-public.jpg",
				"/archive/LJM-20261011-LET-002/back-public.jpg",
				"/archive/LJM-20261011-LET-002/detail-01-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-LET-002",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "LET_1993年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "家人的近况、替我问个好。一封旧信，把牵挂写得像日常一样轻。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1993年友人来信与款项附记，封面/正面。",
				"1993年友人来信与款项附记，细节图。",
				"1993年友人来信与款项附记，细节图。"
			]
		}
	},
	{
		"core": {
			"title": "风浪之外，还有一张英语试卷",
			"accession_date": "2026-10-11",
			"object_type": "LET",
			"date_display": "1996年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-LET-003/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-LET-003",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "LET_1996年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1996 年的船员英语考试通知。出海这件事，连单词也要一起准备。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1996年船员英语适岗考试通知，封面/正面。"
			]
		}
	},
	{
		"core": {
			"title": "退休以后，仍有一张表等着填",
			"accession_date": "2026-10-11",
			"object_type": "LET",
			"date_display": "2007年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-LET-004/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-LET-004",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "LET_2007年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "2007 年的一张住房补贴申请表。勾选很轻，纸上的折痕很重。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"2007年住房货币补贴支取申请表，封面/正面。"
			]
		}
	},
	{
		"core": {
			"title": "蝴蝶结比烦恼大",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-006/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-006",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "小小的脸，轻轻的笑。黑白照片里，童年的亮一点也没被收走。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"蝴蝶结幼儿黑白肖像，正面。"
			]
		}
	},
	{
		"core": {
			"title": "别摆了，这样就很好",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-007/front-public.jpg",
				"/archive/LJM-20261011-PHO-007/back-public.jpg",
				"/archive/LJM-20261011-PHO-007/detail-01-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-007",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NOTE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NOTE"
					],
					"verso_transcription": "背面已扫描，文字内容待发布前人工确认。"
				}
			}
		},
		"public_view": {
			"description": "几张连续的合影里，有人举相机，有人回头，笑还没来得及收好。最动人的一张，常常不那么标准。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"户外栏杆旁的连续合影，正面。",
				"户外栏杆旁的连续合影，细节图。",
				"户外栏杆旁的连续合影，细节图。"
			]
		}
	},
	{
		"core": {
			"title": "花挡住了一点话",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-008/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-008",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-13",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "花束挨着脸，笑意藏在后面。旧照片有点含蓄，刚好让人想多看一眼。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"花束旁女子室内留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "沿这条路，慢慢走",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-009/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-009",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_OTH_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "树影把道路围起来，城市留在远处。旧照片没说目的地，却很会让人停留。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"绿树道路与远城风景，正面。"
			]
		}
	},
	{
		"core": {
			"title": "站近一点，照片才装得下",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-010/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-010",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "几个人挨在镜头前，笑容各有各的样子。绿树只做背景，热闹都在前面。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"绿树前多人合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "仰起头的这一秒",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-011/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-011",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "孩子把脸抬了起来，旁边的人笑着。照片里的动作很小，心里却跟着动了一下。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"木椅上成人与幼儿合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "琴键停了，笑还在",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-012/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-012",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "手留在琴键上，目光转向镜头。这一张无声的照片，偏偏有点像音乐。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"琴键边的黑白留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "一只手，把画面拉近了",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-013/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-013",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "猴子伸来手，人也笑了。山石边的这一瞬，像旧日留下的一点轻巧玩笑。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"山石边喂猴留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "桥过去，楼还在",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-014/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-014",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "一座钢桥、一栋高楼，被同一张旧影连起来。路有来处，照片有余温。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海大厦旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "大世界，小照片",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-015/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-015",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "高塔、街口和路人，都装进一张不大的旧影。世界很大，留住它的纸很薄。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海大世界旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "拐角那栋楼",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-016/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-016",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "工人文化宫立在街角，窗格、电线和行人仍然清楚。日子远了，街角没有。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海工人文化宫旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "高楼把旧日撑了起来",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-017/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-017",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "国际饭店立在街景中央。车辆很小，天空很高，一座城的气势还在。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海国际饭店旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "江边的风，吹进了纸里",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-018/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-018",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "黄浦江畔的楼、车和船，沿着画面排开。黑白很静，江边应该很热闹。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海黄浦江畔旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "塔很高，日子很轻",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-019/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-019",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "龙华塔下有人缓缓走过。远处的时间，被这一张照片放低了声音。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海龙华塔旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "路很宽，旧日很近",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-020/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-020",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "照片题名上海闵行一号路。车和人都在各自的方向里，时间却停在同一张纸上。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海闵行一号路旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "门前的树还那么圆",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-021/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-021",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "少年宫前的树被修得整齐，台阶向屋里延伸。旧影安静，想象却很热闹。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海少年宫旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "桥绕几回，心事少一句",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-022/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-022",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "九曲桥弯进亭阁与水面。照片里没有对白，倒很适合把话藏一会儿。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海豫园九曲桥旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "街角把时间站住了",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-023/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-023",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-16",
			"collection_code": "PHO_年代未知_CITY_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"city": "上海",
			"themes": [
				"SU-CITY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "中百公司的楼影、电车和行人，一起停在这张旧照片里。城市继续往前，它没有。",
			"transcription": "",
			"tags": [
				"上海旧影"
			],
			"image_descriptions": [
				"上海中百公司旧影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "站在一起就行",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-024/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-024",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "石栏旁的一次合影，姿势并不刻意。照片里留住的，是两个人刚好站在一起。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"石栏旁双人合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "怀里有个小小的世界",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-025/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-025",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "藤椅、花裙和怀里的孩子，都留在这一瞬。看着看着，心就软了一点。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"室内抱幼儿留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "日常里，笑一下",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-026/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-026",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "桌椅、电视和一个站姿都很普通。笑留在镜头里，就有了值得回看的理由。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"室内微笑站姿留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "筷子没放下，笑先到了",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-027/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-027",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "一桌人围着饭菜，镜头赶上了吃饭的瞬间。没有特别整齐，却特别让人想多看一眼。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"室内围桌吃饭留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "辫子编得整齐，目光很直",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-028/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-028",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "一张小小的黑白肖像，把童年的认真留了下来。看着那双眼睛，忽然不想急着长大。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"双辫女孩黑白肖像，正面。"
			]
		}
	},
	{
		"core": {
			"title": "在院子里，留住一点明亮",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-029/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-029",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "两个人站在雕塑边，枝叶落进画面。旧颜色里藏着一个让人愿意慢看的瞬间。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"庭院双人与动物雕塑合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "台上的人，台下的目光",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-030/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-030",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "两个人站在灯下，一排观众看着。照片没录下声音，却留下了大家同在的那一刻。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"舞台上的双人留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "这一曲，留在照片里",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-031/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-031",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "舞厅的灯在头顶，两个人站得很近。旧影没有音乐，动作却让人想多停一拍。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"舞厅双人共舞留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "这一吻，留在相纸上",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-032/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-032",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "婚纱、礼服和轻轻闭上的眼睛，都停在同一瞬。照片有些旧，亲近却很清楚。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"影楼婚纱亲吻留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "举杯的时候，日子很满",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-033/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-033",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "菜还在桌上，杯子已经举了起来。旧照片没有声音，热闹却一眼就能看见。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"圆桌举杯聚餐留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "把好看藏在日常里",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-034/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-034",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "一件针织衫，几盆绿植，一个站姿。没有盛大的场面，这一张却很耐看。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"针织衫女子室内留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "风把树梢吹得很好看",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-035/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-035",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_OTH_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "棕榈、草坪和一小圈花坛，留在旧照片里。没有人站在前面，风景也很有表情。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"棕榈与花坛风景，正面。"
			]
		}
	},
	{
		"core": {
			"title": "靠近一点，就够了",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-036/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-036",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "两个人站得很近，粉色的墙在身后。照片没有解释关系，只把这一瞬留得暖暖的。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"粉色墙边双人合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "扶梯往前，照片留下",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-037/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-037",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "红衣的人站在前面，身后还有几个目光。一次路上的合影，把移动的日子停了一秒。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"扶梯上的多人合影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "这身行头，很有自己的主意",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-038/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-038",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "帽子、眼镜、格纹西装，连领口都收拾得讲究。旧照片里的时髦，今天也不怯场。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"格纹西装与帽子肖像，正面。"
			]
		}
	},
	{
		"core": {
			"title": "海很大，这一秒很小",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-039/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-039",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "浪花推到身边，一只手举向天空。照片只留一瞬，辽阔却留得很久。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"海浪中的举手留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "衣服很红，快乐很小",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-040/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PHO-040",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PHO_年代未知_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-FAM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "小椅子上的孩子，穿着一圈白色毛边。小小的姿势，让整张旧照片都变得可爱。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"红色毛边衣装儿童留影，正面。"
			]
		}
	},
	{
		"core": {
			"title": "来玩，好吗",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-004/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-004",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "春节邀约明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "新年祝福写到一半，变成了一个轻轻的邀请。最动人的词，有时只是好吗。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"春节邀约明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "隔着大学的路，还是想见你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-005/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-005",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_COM_MEM+SCH_UNK_UNK",
			"event_scene": [
				"EV-SCH"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "大学近况与盼相聚明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧卡写着学习与近况，也盼有机会相聚。前程很忙，问候没有缺席。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"大学近况与盼相聚明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "那时，画一个世界只需几笔",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-006/front-public.jpg",
				"/archive/LJM-20261011-PST-006/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-006",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_UNK_CHD+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-CHD"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "儿童彩绘书信节明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "手绘人物、颜色和歪歪的线条留在书信节明信片上。认真很满，技巧可以慢慢长。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"儿童彩绘书信节明信片_正背，正面。",
				"儿童彩绘书信节明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "寄一份思念，邮资已经付了",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-012/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-012",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "寄一份思念寄一份祝福明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片上的几句话很短。想念没有展开讲，也已经到了纸上。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"寄一份思念寄一份祝福明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "好久不见，寒假来找我吧",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-014/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-014",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "久别同窗与寒假邀约明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "问近况、谈学习，再约假期见面。明信片上的距离，被一句邀约拉近了。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"久别同窗与寒假邀约明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "回信迟了，惦记还在",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-015/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-015",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "久未回信的致歉与邀约明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "几行字先道歉，再问近况，最后说有空来坐坐。笨拙的认真，也很动人。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"久未回信的致歉与邀约明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "热闹散了，还想再聚",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-016/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-016",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "剧团相聚与春节邀约邮政明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "手写字提起一次相聚，也邀请节日里再来。人群散开以后，问候接着。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"剧团相聚与春节邀约邮政明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "江很静，信有一点着急",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-017/front-public.jpg",
				"/archive/LJM-20261011-PST-017/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-017",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_VIEW_UNK_OTH+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-VIEW"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "漓江鸬鹚明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "正面是漓江，背面问寄出的信是否收到。山水慢慢的，惦记却等不住。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"漓江鸬鹚明信片_正背，正面。",
				"漓江鸬鹚明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "车留在纸上，祝福已经上路",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-018/front-public.jpg",
				"/archive/LJM-20261011-PST-018/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-018",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_OTH_UNK_TRN+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-TRN"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-OTH"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "铃木VS1400GLJ摩托明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "正面是铃木摩托，背面是几句祝愿。机器很硬，寄来的人情很软。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"铃木VS1400GLJ摩托明信片_正背，正面。",
				"铃木VS1400GLJ摩托明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "猫很会睡，字很会暖",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-020/front-public.jpg",
				"/archive/LJM-20261011-PST-020/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-020",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_ART_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-ART"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "猫岛拼贴与同行寄语明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "猫岛拼贴在正面，感谢陪伴的寄语在背面。可爱的外壳里，装着认真的话。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"猫岛拼贴与同行寄语明信片_正背，正面。",
				"猫岛拼贴与同行寄语明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "去努力吧，我在字里陪你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-022/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-022",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "努力与友情寄语明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一段关于理想与努力的手写寄语，落在明信片上。鼓励后面，还藏着对友情的认真。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"努力与友情寄语明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "普通，也可以郑重",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-023/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-023",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "普通人不做平庸事新年寄语明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "新年寄语写在一张明信片背面。说自己普通，也说不愿把日子过得敷衍。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"普通人不做平庸事新年寄语明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "忙着考试，也没忘了你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-024/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-024",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "期末考试近况与圣诞祝福明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "字写得密，近况说得多。期末的忙碌里，仍留了一句节日问候。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"期末考试近况与圣诞祝福明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "字换了语言，牵挂没有",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "1997年10月4日",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-027/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-027",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_1997年10月4日_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "1997年10月4日"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "日文手写书信与信封_1997年10月4日"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "信封与两页日文手写信留在同一张扫描里。笔画不同，郑重相同。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"日文手写书信与信封_1997年10月4日，正面。"
			]
		}
	},
	{
		"core": {
			"title": "愿你美好，也愿你自在",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-028/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-028",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "容貌与内涵寄语新年明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片把新年祝福与关于内涵的寄语写在一起。几行字，留下了一次认真劝慰。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"容貌与内涵寄语新年明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "走远一点，也没忘了你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "2012年8月5日",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-030/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-030",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_2012年8月5日_VIEW_TRV_OTH+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-VIEW"
				},
				"PC02": {
					"postcard_function": "PF-TRV"
				},
				"PC04": {
					"writing_date_text": "2012年8月5日"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "束河古镇旅途明信片背面_2012年8月5日"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "人在古镇，惦记却很近。明信片写了旅途，也写了记得照顾自己。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"束河古镇旅途明信片背面_2012年8月5日，背面。"
			]
		}
	},
	{
		"core": {
			"title": "把树写进信里",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-031/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-031",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "树与远方随笔明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "明信片背面留着几行随笔。树、画与远方，被笔尖放在同一张纸上。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"树与远方随笔明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "借一片海，寄几句祝福",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-034/front-public.jpg",
				"/archive/LJM-20261011-PST-034/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-034",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_VIEW_GRT_OTH+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-VIEW"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "威基基海滩节日祝福明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "海滩在正面，节日问候在背面。风景很远，手写的几行字却很近。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"威基基海滩节日祝福明信片_正背，正面。",
				"威基基海滩节日祝福明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "把这点温馨带在身边",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-035/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-035",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "温馨祝福随身相伴明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片上的祝愿说得很直接。纸能放进口袋，心意也想跟着你走。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"温馨祝福随身相伴明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "把房间翻过去，是一句祝福",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-036/front-public.jpg",
				"/archive/LJM-20261011-PST-036/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-036",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_ART_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-ART"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "我的房间装饰明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "蓝瓶、细花和小摆件在正面，英文圣诞问候在背面。私人角落也能成为寄出的温柔。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"我的房间装饰明信片_正背，正面。",
				"我的房间装饰明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "怕也没关系，还是可以往前",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-040/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-040",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "相信自己放手一搏寄语卡背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧卡上的寄语谈勇气与自信。手写字像站在身后，轻轻扶了一下。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"相信自己放手一搏寄语卡背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "祝福想敲一下你的窗",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-041/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-041",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "心灵之窗新年祝福明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "几行手写字，把新年问候比作敲窗。声音很小，来意很清楚。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"心灵之窗新年祝福明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "别哭，下一年也陪你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-042/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-042",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "新年祝愿与别哭贴纸明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "新年祝愿旁边贴着小熊和别哭。卡片没有说很多，已经像轻轻抱了一下。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"新年祝愿与别哭贴纸明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "黄色的花，替人说新年好",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-043/front-public.jpg",
				"/archive/LJM-20261011-PST-043/back-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-043",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_ART_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-ART"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "姚黄牡丹新年祝福明信片_正背"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "姚黄牡丹立在瓶中，背面是中英文新年问候。祝愿没有铺张，颜色已经够暖。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"姚黄牡丹新年祝福明信片_正背，正面。",
				"姚黄牡丹新年祝福明信片_正背，背面。"
			]
		}
	},
	{
		"core": {
			"title": "又一年了，你呢",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-044/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-044",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "宜昌近况与新年问候明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片先交代自己的近况，再把问题交给远处的人。想知道你过得怎么样，仍很认真。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"宜昌近况与新年问候明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "把技术问题，也写得很认真",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-045/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-045",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "移动通信技术询问邮政明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一张邮政明信片上，密密写着通信与手机的问题。兴趣很具体，字也很投入。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"移动通信技术询问邮政明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "一张卡，也能问一件认真事",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-046/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-046",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "邮政汇票图谱咨询明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片上是一段对邮政资料的咨询。兴趣有多具体，字就写得多仔细。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"邮政汇票图谱咨询明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "祝福也照顾到你的家人",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-048/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-048",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "元旦与家人祝愿明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "几行竖写的问候，把朋友与家人一并放在心上。明信片很小，挂念很周全。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"元旦与家人祝愿明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "把计划，一点点变成现实",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-050/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-050",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-UNK"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "愿新一年把计划变现实明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧明信片先问近况，再谈新一年。祝福不飘在天上，落在了具体的生活里。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"愿新一年把计划变现实明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "学习要进步，也记得来玩",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-051/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-051",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_COM_MEM+SCH_UNK_UNK",
			"event_scene": [
				"EV-SCH"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "愿学业进步与来家玩明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "旧卡一边祝学业，一边邀见面。认真和亲近，被写在了同一处。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"愿学业进步与来家玩明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "风来时，算我问候过你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-052/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-052",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-GRT"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "愿做远方风铃的祝福明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "一张旧贺卡，用风铃写远方的祝福。说得很轻，惦记并不轻。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"愿做远方风铃的祝福明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "你最近点样啊",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-054/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-054",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-GRT"
				},
				"PC02": {
					"postcard_function": "PF-COM"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "粤语近况与圣诞祝福明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "手写问候带着口语的亲近。明信片不大，熟悉的语气刚好装得下。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"粤语近况与圣诞祝福明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "这里很美，差一个你",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "年代未知",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PST-056/front-public.jpg"
			],
			"batch_id": "FSA-20261011-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场摊主",
			"source_date": "2026-10-11",
			"source_place": "旧货市场",
			"item_id": "LJM-20261011-PST-056",
			"created_date": "2026-10-12",
			"updated_date": "2026-10-12",
			"collection_code": "PST_年代未知_UNK_TRV_MEM+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-UNK"
				},
				"PC02": {
					"postcard_function": "PF-TRV"
				},
				"PC04": {
					"writing_date_text": "年代未知"
				},
				"PC07": {
					"dispatch_place": "寄出地点待确认"
				},
				"PC11": {
					"correspondence_relationship": "通信关系待确认"
				},
				"PC12": {
					"image_subject": "这里很美快点来航空边框明信片背面"
				},
				"PC18": {
					"stamp_status": "邮票情况待确认"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-UNK"
					]
				},
				"PC21": {
					"postcard_use": [
						"PU-UNK"
					]
				}
			}
		},
		"public_view": {
			"description": "明信片只写了短短的邀约。再好的地方，也会让人想叫上一个人。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"这里很美快点来航空边框明信片背面，背面。"
			]
		}
	},
	{
		"core": {
			"title": "五项阴性，第一针",
			"accession_date": "2026-10-18",
			"object_type": "CRD",
			"date_display": "1996年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-CRD-001/front-public.jpg",
				"/archive/LJM-20261018-CRD-001/back-public.jpg",
				"/archive/LJM-20261018-CRD-001/detail-01-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-CRD-001",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "CRD_1996年_OTH_SVC_EXP_UNK+COL_NON_COM+C2+YEL",
			"carrier": "MT-UNK",
			"color": "CL-COL",
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "card",
			"dimensions": {
				"CD01": {
					"card_type": "CT-OTH"
				},
				"CD02": {
					"card_functions": [
						"KF-SVC"
					]
				},
				"CD12": {
					"card_status": "KS-EXP"
				},
				"CD16": {
					"material_details": "纸质印刷表格，含手写与印章"
				},
				"CD17": {
					"card_technologies": [
						"KT-NON"
					]
				},
				"CD20": {
					"card_completeness": "KC-COM"
				},
				"CD21": {
					"redaction_status": "RD-MASK",
					"restricted_fields": "姓名/签名/工号（已局部马赛克）"
				}
			}
		},
		"public_view": {
			"description": "1996年8月23日，广州远洋运输公司综合门诊部。乙肝两对半五项全阴，当天注射第一针疫苗，30微克。跑船的人，身体就是本钱——这一纸\"阴性\"，是他下一次远航前，给家里最踏实的交代。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"乙肝疫苗注射卡，正面。",
				"注射卡背面（印刷注意事项）。",
				"乙肝二对半检验报告单。"
			]
		}
	},
	{
		"core": {
			"title": "下船了，也得按时打卡",
			"accession_date": "2026-10-18",
			"object_type": "CRD",
			"date_display": "1991年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-CRD-002/front-public.jpg",
				"/archive/LJM-20261018-CRD-002/back-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-CRD-002",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "CRD_1991年_OTH_OTH_EXP_UNK+COL_NON_COM+C2+YEL",
			"carrier": "MT-UNK",
			"color": "CL-COL",
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "card",
			"dimensions": {
				"CD01": {
					"card_type": "CT-OTH"
				},
				"CD02": {
					"card_functions": [
						"KF-OTH"
					]
				},
				"CD12": {
					"card_status": "KS-EXP"
				},
				"CD16": {
					"material_details": "纸质印刷表格，含手写与印章"
				},
				"CD17": {
					"card_technologies": [
						"KT-NON"
					]
				},
				"CD20": {
					"card_completeness": "KC-COM"
				},
				"CD21": {
					"redaction_status": "RD-MASK",
					"restricted_fields": "姓名/住址末段/签名（已局部马赛克）"
				}
			}
		},
		"public_view": {
			"description": "1991年，广州远洋运输公司，公休船员学习登记卡。船员公休在家，每月四日仍要回公司学习，考勤员一个个签名、打勾。海上漂了半辈子的人，上了岸，依然被一张小卡片牵着走——那是一个单位管到人的年代。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"公休船员学习登记卡，正面。",
				"登记卡背面（考勤记录）。"
			]
		}
	},
	{
		"core": {
			"title": "天涯海角我给你的吻",
			"accession_date": "2026-10-18",
			"object_type": "LET",
			"date_display": "1987年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-LET-001/front-public.jpg",
				"/archive/LJM-20261018-LET-001/detail-01-public.jpg",
				"/archive/LJM-20261018-LET-001/detail-02-public.jpg",
				"/archive/LJM-20261018-LET-001/detail-03-public.jpg",
				"/archive/LJM-20261018-LET-001/detail-04-public.jpg",
				"/archive/LJM-20261018-LET-001/detail-05-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-LET-001",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "LET_1987年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1987年元月17日，大连港，船即开航。一个远洋船员在离家前写下六页长信：春节不能回家了，别给孩子乱吃油炸的，晚上早点睡，别急着回信——海上航行一个月，收不到信别慌。信的末尾他说：\"天涯海角我给你的吻，亲爱的萍。\"有些浪漫，是要隔着一整个大洋才说得出口的。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1987年春节大连港夫致妻家信，第1页。",
				"第2页。",
				"第3页。",
				"第4页。",
				"第5页。",
				"第6页（落款页）。"
			]
		}
	},
	{
		"core": {
			"title": "请你放心为好，安心工作",
			"accession_date": "2026-10-18",
			"object_type": "LET",
			"date_display": "1988年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-LET-002/front-public.jpg",
				"/archive/LJM-20261018-LET-002/back-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-LET-002",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "LET_1988年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1988年2月11日晚，妻子给在船上的丈夫回信：一个月没收到你的信了，家里都好，孩子这个月感冒了两次——说到这里她停了停，又补一句\"请你放心为好，安心工作\"。报喜也报忧，但每一笔落的都是\"别挂念\"。持家的人，连诉苦都是克制的。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1988年妻致夫回信，第1页。",
				"第2页（落款页）。"
			]
		}
	},
	{
		"core": {
			"title": "深夜两点，值班中起草",
			"accession_date": "2026-10-18",
			"object_type": "LET",
			"date_display": "1988年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-LET-003/front-public.jpg",
				"/archive/LJM-20261018-LET-003/detail-01-public.jpg",
				"/archive/LJM-20261018-LET-003/detail-02-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-LET-003",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "LET_1988年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1988年4月23日深夜两点，湛江调顺码头，货装完就走，目的地西德，航程一个月。他趁着值班的间隙给妻子写信：原谅我临时叫你别来，天热了记得挂蚊帐，单位里该争的要争，别受人利用。一个男人出海前夜的心思，全在这三页纸里了。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1988年赴西德前湛江港夫致妻家信，第1页。",
				"第2页。",
				"第3页（落款页）。"
			]
		}
	},
	{
		"core": {
			"title": "工资一千四百二十七块九毛二",
			"accession_date": "2026-10-18",
			"object_type": "LET",
			"date_display": "1994年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-LET-004/front-public.jpg",
				"/archive/LJM-20261018-LET-004/back-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-LET-004",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "LET_1994年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1994年元月3日，妻子给船上的丈夫写回信。孩子的期末考试、珠算、寒假安排，事无巨细；末了把他的工资数目一笔一划抄在信里：壹仟肆佰贰拾柒元玖角贰分。她不懂浪漫，她只把这个家记得分毫不差。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1994年春节妻致夫回信，第1页。",
				"第2页（落款页）。"
			]
		}
	},
	{
		"core": {
			"title": "自行车的事，决不反悔",
			"accession_date": "2026-10-18",
			"object_type": "LET",
			"date_display": "1997年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-LET-005/front-public.jpg",
				"/archive/LJM-20261018-LET-005/detail-01-public.jpg",
				"/archive/LJM-20261018-LET-005/detail-02-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-LET-005",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "LET_1997年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "1997年3月10日，荷兰鹿特丹港。儿子考了全级第46名，写信告诉了爸爸。爸爸从半个地球外回信：先夸，再教写作文、教数学，最后郑重承诺——\"自行车的事，我一口应成和答复，决不反悔\"。父爱就是这样，远在海角，也要把答应孩子的事钉死。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"1997年鹿特丹港父致子信（广州远洋运输公司稿纸），第1页。",
				"第2页。",
				"第3页（落款页）。"
			]
		}
	},
	{
		"core": {
			"title": "一个人带回来的半座大连",
			"accession_date": "2026-10-18",
			"object_type": "PHO",
			"date_display": "约1959年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261018-PHO-001/front-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-01-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-02-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-03-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-04-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-05-public.jpg",
				"/archive/LJM-20261018-PHO-001/detail-06-public.jpg"
			],
			"batch_id": "FSA-20261018-B01",
			"physical_location": "家中",
			"acquisition_method": "PR-FAM",
			"item_id": "LJM-20261018-PHO-001",
			"created_date": "2026-10-19",
			"updated_date": "2026-10-19",
			"collection_code": "PHO_约1959年_CITY+MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"province": "辽宁省",
			"city": "大连市",
			"specific_place": "旅顺友谊塔；青泥洼桥；明泽池；劳动公园；工业博物馆；大连火车站；星海村浴场",
			"themes": [
				"SU-CITY",
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-MEM"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				}
			}
		},
		"public_view": {
			"description": "旅顺友谊塔、青泥洼桥、明泽池、劳动公园、工业博物馆、火车站、星海村浴场——七张黑白纪念照，边角印着手写体地名。这大概是一位远洋船员在大连停靠时买下的。船在港里停几天，他就把这座城装进了口袋，带回家给妻子孩子看：你们看，我到过这里。",
			"transcription": "",
			"tags": [],
			"image_descriptions": [
				"旅顺友谊塔。",
				"大连青泥洼桥。",
				"大连明泽池划船。",
				"大连劳动公园之一角。",
				"大连工业博物馆（门楣横幅\"庆祝建国十周年展览会\"）。",
				"大连火车站。",
				"大连星海村浴场。"
			]
		}
	}
] satisfies ArchiveItem[];

export type { ArchiveItem } from './archive-schema';
