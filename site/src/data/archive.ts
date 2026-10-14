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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1960-01-01",
			"date_end": "1960-01-01",
			"time_notes": "据发布图片手写落款识读为1960-01-01；这是书写时间，不等同发行时间。仅记录题字所标一九六〇年元旦；照片纸边另有FUJICOLOR HR 84，照片实际拍摄、冲印时间须另核，不视为1960年的照片。",
			"country": "日本",
			"place_notes": "手写赠语落款写大阪，记录书写关联城市；不是从人物身份推断。",
			"province": "大阪府",
			"city": "大阪市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1960-01-01。仅记录题字所标一九六〇年元旦；照片纸边另有FUJICOLOR HR 84，照片实际拍摄、冲印时间须另核，不视为1960年的照片。；手写赠语落款写大阪，记录书写关联城市；不是从人物身份推断。；内页含中文称谓及日文贺年文字。；旧记录缺少正式必填的通信关系维度；未查明关系，按文本字段如实标记待考，不推断当事人身份。；2026-10-14补核：公开图为折叠贺卡内页与题字页，均未见邮票，不能据此断言从未贴票。"
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
				"PC20": {
					"language": [
						"中文",
						"日文"
					]
				},
				"PC11": {
					"correspondence_relationship": [
						"具体通信关系待考"
					]
				},
				"PC18": {
					"stamp_status": [
						"现有公开图未见邮票；是否随信封寄送待考"
					]
				}
			}
		},
		"public_view": {
			"description": "从富士山下  到一句新年快乐",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"place_display": "",
			"place_filters": []
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
			"updated_date": "2026-08-29",
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
			"city": "未知"
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
			"place_filters": [],
			"place_display": "未知地点，海滩"
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
			"updated_date": "2026-08-30",
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
			"description": "",
			"transcription": "",
			"tags": [
				"珠海"
			],
			"place_display": "珠海",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-003",
			"object_type": "PHO",
			"title": "永动机诞生了",
			"date_display": "1990",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-003/front-public.jpg"
			],
			"collection_code": "PHO_1990_OTH_OTH_NONE_C0+OTH_G",
			"accession_date": "2026-08-08",
			"batch_id": "FSA-20260808-CCQ",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_place": "哈尔滨",
			"source_name": "闲鱼旧货老板",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C0",
			"condition_details": [
				"DM-OTH"
			],
			"scan_ppi": 600,
			"scan_date": "2026-08-21",
			"created_date": "2026-09-04",
			"updated_date": "2026-09-04",
			"province": "河南省",
			"city": "吕梁市",
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
				}
			}
		},
		"public_view": {
			"description": "大中国  永动车",
			"transcription": "",
			"revision_note": "",
			"tags": [
				"永动机"
			],
			"place_filters": [
				"河南",
				"珠海"
			],
			"place_display": "未知"
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-004",
			"object_type": "PHO",
			"date_display": "1970",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-004/front-public.jpg",
				"/archive/LJM-20260808-PHO-004/back-public.jpg"
			],
			"collection_code": "PHO_1970_MEM_OTH_NONE_C2+FAD+MOL_G",
			"accession_date": "2026-08-08",
			"title": "机车青年",
			"batch_id": "FSA-20260808-CCQ",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "旧货市场老板",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"event_scene": [
				"EV-DLY"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-FAD",
				"DM-MOL"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-04",
			"updated_date": "2026-09-04",
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
				}
			}
		},
		"public_view": {
			"description": "车可以停，年前的时候不太会",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"place_display": "",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-005",
			"object_type": "PHO",
			"title": "一周岁纪念",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-005/front-public.jpg",
				"/archive/LJM-20260808-PHO-005/back-public.jpg"
			],
			"collection_code": "PHO_1990_CHD_MEM_DATE+NAME_C1+OTH_G",
			"accession_date": "2026-08-08",
			"batch_id": "FSA-20260808-CCQ",
			"physical_location": "佛山",
			"date_display": "1990",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "佛山天光墟",
			"province": "广东省",
			"city": "佛山市",
			"themes": [
				"SU-CHD"
			],
			"event_scene": [
				"EV-FAM"
			],
			"condition_grade": "C1",
			"condition_details": [
				"DM-OTH"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-05",
			"updated_date": "2026-09-05",
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
						"VS-DATE",
						"VS-NAME"
					],
					"verso_transcription": "xxx一岁纪念照"
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
			"description": "一家四口，一只蛋糕",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"place_display": "",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PHO-006",
			"accession_date": "2026-08-08",
			"object_type": "PHO",
			"title": "当年同框",
			"date_display": "1989",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PHO-006/front-public.jpg"
			],
			"collection_code": "PHO_1989_MEM_MEM_NONE_C0+OTH_G",
			"batch_id": "FSA-20260808-102",
			"acquisition_method": "PR-PUR",
			"province": "广东省",
			"themes": [
				"SU-MEM"
			],
			"event_scene": [
				"EV-SCH"
			],
			"condition_grade": "C0",
			"condition_details": [
				"DM-OTH"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"physical_location": "佛山",
			"created_date": "2026-09-07",
			"updated_date": "2026-09-07",
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
			"description": "那晚大家都朝镜头笑了一下，后来就各自去和命运单聊了。",
			"transcription": "",
			"revision_note": "",
			"tags": []
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
			"research_status": "R1",
			"evidence_level": "A",
			"evidence_basis": "用户提供并确认的公开元数据。\n2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；背面手写79.12。",
			"digitization_status": "DG3",
			"transcription_status": "TX2",
			"backup_status": "BU0",
			"publication_file_path": [
				"/archive/LJM-20260808-PST-001/front-public.jpg",
				"/archive/LJM-20260808-PST-001/back-public.jpg"
			],
			"use_status": "U3",
			"created_date": "2026-08-27",
			"updated_date": "2026-10-14",
			"next_action": "无；本次合并、正式构建和页面文件检查已完成。",
			"notes": "原编号 LJM-20260827-LET-001 的信件实际为本件明信片的附属信件，现已连同两张发布图片并入本主档。用户此前已确认附属信件的收件称呼、落款和通信内容允许公开且无需遮盖。",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"physical_location": "哈尔滨",
			"collection_code": "PST_1979_VIEW_COM_MEM+FST_UNK_MAI",
			"time_notes": "背面记79.12，支持既有1979年，精确日不详。",
			"last_research_date": "2026-10-13",
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
						"中文"
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
					"writing_date": "1979-12",
					"writing_date_text": "79.12"
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
			"place_display": "哈尔滨",
			"place_filters": [
				"哈尔滨"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PST-002",
			"object_type": "PST",
			"title": "天鹅很肥",
			"privacy_level": "G",
			"rights_status": "OWN",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2013-12-09",
			"date_end": "2013-12-09",
			"time_notes": "据发布图片手写落款识读为2013-12-09；这是书写时间，不等同发行时间。",
			"country": "瑞士",
			"place_notes": "图版明确印有Switzerland，并将多个山峰与卢塞恩拼图并置；只记国家，不把出版地当作全部画面地点。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 2013-12-09。；图版明确印有Switzerland，并将多个山峰与卢塞恩拼图并置；只记国家，不把出版地当作全部画面地点。；图片印刷发行信息：GLOBETROTTER GmbH，Luzern。出版地不作寄出地。；正反面印字与手写正文。；旧记录缺少正式必填的通信关系维度；未查明关系，按文本字段如实标记待考，不推断当事人身份。；2026-10-14补核：通信面右上方可见邮票揭除后的残留与齿孔边缘，国家、版别和面值无法确认。"
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
				"PC20": {
					"language": [
						"中文",
						"英文"
					]
				},
				"PC13": {
					"publisher": [
						"GLOBETROTTER GmbH"
					],
					"publisher_place": [
						"Luzern"
					]
				},
				"PC06": {
					"image_place_text": [
						"Switzerland",
						"Luzern"
					]
				},
				"PC11": {
					"correspondence_relationship": [
						"具体通信关系待考"
					]
				},
				"PC18": {
					"stamp_status": [
						"曾有／缺失（保留齿孔边缘及揭除痕迹）"
					]
				}
			}
		},
		"public_view": {
			"description": "",
			"transcription": "",
			"revision_note": "",
			"tags": [],
			"place_display": "",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260808-PST-003",
			"object_type": "PST",
			"date_display": "2012",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260808-PST-003/front-public.jpg",
				"/archive/LJM-20260808-PST-003/back-public.jpg"
			],
			"collection_code": "PST_2012_ART_TRV_OTH+TRV_DSP+ARR_MAI",
			"accession_date": "2026-08-08",
			"title": "不停行走的人",
			"batch_id": "FSA-20260808-CCQ",
			"physical_location": "佛山",
			"source_name": "旧货市场老板",
			"source_place": "佛山天光墟",
			"acquisition_method": "PR-PUR",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-05",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2012-08-05",
			"date_end": "2012-08-05",
			"time_notes": "据发布图片手写落款识读为2012-08-05；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "正文明确自述正在丽江束河古城，记录书写地点；未把湖景擅自命名。",
			"province": "云南省",
			"city": "丽江市",
			"specific_place": "束河古城",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 2012-08-05。；正文明确自述正在丽江束河古城，记录书写地点；未把湖景擅自命名。；丽江寄递邮戳与正文城市互证。；旧记录缺少正式必填的通信关系维度；未查明关系，按文本字段如实标记待考，不推断当事人身份。；2026-10-14补核：通信面右上方邮票印中国邮政CHINA及1元，邮票仍在位；不推断具体鸟种或发行版别。"
		},
		"metadata": {
			"schema": "postcard",
			"dimensions": {
				"PC01": {
					"postcard_type": "PT-ART"
				},
				"PC02": {
					"postcard_function": "PF-TRV"
				},
				"PC19": {
					"postal_mark_types": [
						"PM-DSP",
						"PM-ARR"
					]
				},
				"PC21": {
					"postcard_use": "PU-MAI"
				},
				"PC04": {
					"writing_date": "2012-08-05",
					"writing_date_text": "20120805"
				},
				"PC07": {
					"dispatch_place": [
						"云南省丽江市"
					]
				},
				"PC05": {
					"dispatch_date": "2012-08-05"
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC11": {
					"correspondence_relationship": [
						"具体通信关系待考"
					]
				},
				"PC18": {
					"stamp_country": [
						"中国"
					],
					"stamp_value": [
						"1元"
					],
					"stamp_issue": [
						"鸟类图案（版别待考）"
					],
					"stamp_status": [
						"在位"
					]
				}
			}
		},
		"public_view": {
			"description": "你是个不停行走的人吧",
			"transcription": "",
			"revision_note": "",
			"place_display": "广州",
			"place_filters": [],
			"tags": [
				"旅行",
				"友情"
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
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260828-PHO-001/front-public.jpg"
			],
			"physical_location": "佛山",
			"created_date": "2026-08-28",
			"updated_date": "2026-10-14",
			"batch_id": "FSA-202628-CCQ",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"acquisition_method": "PR-PUR",
			"date_display": "1992",
			"source_place": "东北",
			"collection_code": "PCD_1992_COM_COL_MEM+OTH_OTH_MAI",
			"country": "俄罗斯",
			"time_notes": "纪念邮戳可见22.08.1992，与既有1992年一致；记为邮戳日期，不认定照片拍摄日期。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；画面底部纪念邮戳直接印有22 08 1992。；现有公开图仅为纪念照片、邮票和纪念邮戳，没有私人通信正文。；2026-10-14补核：正面右下角邮票可读ПОЧТА СССР、7к、1991，并见建筑及三色旗图案；票面国家与1992年纪念戳分开记录。",
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
				"PC20": {
					"language": [
						"俄文"
					]
				},
				"PC05": {
					"dispatch_date": "1992-08-22"
				},
				"PC11": {
					"correspondence_relationship": [
						"不适用（纪念邮品，无私人通信正文）"
					]
				},
				"PC18": {
					"stamp_country": [
						"苏联（票面СССР）"
					],
					"stamp_value": [
						"7к（票面原文）"
					],
					"stamp_issue": [
						"建筑与三色旗图案，票面年份1991"
					],
					"stamp_status": [
						"在位"
					]
				}
			}
		},
		"public_view": {
			"description": "",
			"transcription": "",
			"tags": [
				"历史",
				"苏联"
			],
			"place_display": "",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-001",
			"object_type": "LET",
			"date_display": "1987",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-001/front-public.jpg",
				"/archive/LJM-20260829-LET-001/back-public.jpg",
				"/archive/LJM-20260829-LET-001/detail-01-public.jpg",
				"/archive/LJM-20260829-LET-001/detail-02-public.jpg"
			],
			"collection_code": "LET_1987",
			"accession_date": "2026-08-29",
			"title": "明的家书19870526",
			"batch_id": "FSA-20260829-CCQ",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场",
			"source_place": "佛山天光墟",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"backup_status": "BU0",
			"created_date": "2026-09-04",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1987-05-26",
			"date_end": "1987-05-26",
			"time_notes": "据detail-02-public.jpg 手写落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"province": "辽宁省",
			"city": "大连市",
			"specific_place": "大连锚地",
			"place_notes": "据落款“于大连锚地”记录书写地点；只保留公共港口层级，不涉及私人地址。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20260829-LET-001/detail-02-public.jpg 手写落款：日期 1987-05-26。；detail-02-public.jpg 落款明确记有1987年5月26日及大连锚地。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "信里没写多少想念。\n只是问孩子的成绩，问房子租出去没有，问这个月寄多少钱回来。\n成年人那点爱，好像总要借些不相干的事情，才好意思说出口。",
			"transcription": "*萍：\n\n    你和孩子好！你在四月十四日、廿八日给我的\n两封来信已经收到。阅了你信中的详细内容，\n使我深知家庭的一切，我感到十分的高兴。\n其次，特别感谢你对我的特别关心，【字迹不清】。\n\n    对于我被分配去美国波特兰【字迹不清】的\n港口是国内大连港。抵达大连港的时间是五\n月十三日下午六时到港的，现【疑：船在锚地】待卸\n货任务，具体什么时间靠港还没详细确知。\n\n    对于【字迹不清】的海员方面，我就卸完货之后，\n我就在国内装货，准备跑一个航次以回东方\n能休假。按目前的时间推算，我在原船\n一个航次回来的话，可能会缩短时间。对于\n时间的【字迹不清】，一天按三天计，可能时间不会\n长，故请你在家安心地工作为好，为此我挂\n念为盼。有关我在船今后职务、工资方面，在\n去年九月份开始算付，三月份的工资问题已\n全部解决，请不要对这方面担心为好。\n\n    对于你目前的经济方面，各方面的钱已凑在一起，\n【字迹不清】存入一些外币之外，其余的人民币\n已经汇入【字迹不清】方面。所以，我考虑今后\n我休假的开支方面，我的计划希望你能\n节省一部钱的。现在我不知你是否每个\n月拿到工资后，除去120元伙食费之外的其余\n存入银行。对于这方面我是很清楚的，在\n此，我劝你花钱要有个计划，留一条后路\n为上策。总之，要买的东西也得买，我并不是\n限制你的用钱，不过要合理一点。生活\n一般过得去的情况下，节约一些钱是必\n要的。另外，像在来信谈到目前广州的蔬\n菜比较贵，【字迹不清】，并不是\n强求于你在一定的范围内用钱，不过，我\n的意见是做到合理有计划的开支。\n\n    再一方面教育孩子方面，应该做到引导孩子\n做到认真的教育，孩子不听话也不好，\n太溺爱也不好，总而言之，全面的教育\n【疑：有必要】。关于你在来信谈到，【身体情况字迹不清】，\n因此，我也为你十分的担\n心。平常在【字迹不清】的情况下，我希望你\n多工作些为好，无法上班的话不要勉强\n地去做，身体也是一个本钱，所以，我希望你\n多注意些为好。\n\n    对于你在来信谈到我们之间\n的见面问题，对于这方面我已有十个月如\n一日一样十分想念你和孩子，对于你们也是\n十分想念我，这方面我也是很想【字迹不清】。但\n是船偏偏不靠南方港口，在此想我也十\n分抱歉了，很对不起你了。由于大连的路\n途比较远，又加上你又【字迹不清】，这方面\n来讲，我会【字迹不清】了，请你多给我原谅\n为好。不妥之处，望来信指正为盼。\n\n    主要：由于时间的关系，其他的事我想\n少谈了。最后，我希望你今后【字迹不清】之后，请\n每一个月的工资的情况报告一下；自四月份\n开始。再方面，如果我此次【字迹不清】在【疑：五月五】\n日之前收到的信，请速笔寄到大连外\n轮代理公司转我就可以。我方面，近事\n各方面正常，工作顺利，敬请勿念为\n盼。再见！亲爱的吻！\n\n\n                                      【疑：光敏】\n\n此致\n敬礼\n\n\n                              丈夫*\n\n                    1987年5月26日于大连锚地\n                                      【疑：船上】\n\n\n注：如若于6月5号或不见我电报，\n    回去的话，【后半句字迹不清】。",
			"revision_note": "",
			"tags": [
				"明家的信",
				"明的家书"
			],
			"place_display": "广州",
			"place_filters": [],
			"image_descriptions": [
				"第1页",
				"第2页",
				"第3页",
				"第4页"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-002",
			"object_type": "LET",
			"date_display": "1987",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-002/front-public.jpg",
				"/archive/LJM-20260829-LET-002/back-public.jpg"
			],
			"collection_code": "LET_1987",
			"accession_date": "2026-08-29",
			"title": "给叔叔的信",
			"batch_id": "FSA-20260829-CCQ",
			"acquisition_method": "PR-PUR",
			"physical_location": "佛山",
			"source_name": "旧货市场",
			"source_place": "天光墟旧货市场地摊",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"backup_status": "BU0",
			"date_start": "1987-02-23",
			"date_end": "1987-02-23",
			"country": "中国",
			"province": "广东省",
			"city": "肇庆市",
			"created_date": "2026-09-04",
			"updated_date": "2026-09-05",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"district": "封开县"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "纸已经旧了，十几岁时那点不服输，倒还很新。",
			"transcription": "叔叔：\n\n　　你好，你的信已收到，在信中我得到了不少鼓励，我阅信后使我信心倍增。\n\n　　叔，我想现在你的时间一定很忙吧！时间转眼瞬间过去了，不觉已过半个学期，期中考试已近，成绩并不算佳，不过你不必担心，它不会使我灰心丧气，相反我更加努力了。因为我明白，经过自己的努力考不上，那是【疑：好办】，即使考不上，我以后也不感到遗憾。考不上，我还有雄心一颗，正是你说的那样，做一个有理想的中华人民共和国公民，我一定记住你的教诲，在那不平坦的大道上向前走，要牢记你说过：“路是在没有路的地方踩出来的，是从充满荆棘的地方开辟出来的！”我也要这样，踏着充满荆棘的地方前进。\n\n　　现在我们很少有娱乐活动，同学们一到课堂就会拿起书本学习，根本没有闲暇，唉，他们的想法是：现在辛苦些，到以后考上就会好的。我在同学当中可能是最差的一个，我要勇往直前地追上去，虽然现在没有成果，我不感到忧伤。\n\n　　好了，因为时间紧，很多功课要做，闲事少谈，就此停笔！信中很多地方不对的话，批评指出，使我能有进步。\n\n　　　　　　　　　　　　　　　　此致\n\n敬礼！\n\n　　　　　　　　　　　　　　　　侄女*\n\n　　　　　　　　　　　　　　　　1987年4月23日\n\n回信地址：封开县鱼涝中学初三（4）班。",
			"revision_note": "",
			"tags": [
				"明家的信"
			],
			"place_display": "",
			"place_filters": [],
			"image_descriptions": [
				"第1页",
				"第2页"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-003",
			"object_type": "LET",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-003/front-public.jpg"
			],
			"collection_code": "LET_1980S",
			"accession_date": "2026-08-29",
			"title": "新年的一封信",
			"batch_id": "FSA-20260829-CCQ",
			"physical_location": "佛山",
			"date_display": "1980s",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场",
			"source_place": "佛山天光墟",
			"scan_ppi": 600,
			"scan_date": "2026-09-01",
			"province": "广东省",
			"city": "广州市",
			"country": "中国",
			"created_date": "2026-09-05",
			"updated_date": "2026-09-05",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "那年想买一台十八寸彩电，也想把自己的日子过明白。前一件后来大概容易些。",
			"transcription": "*：\n\n　　你好！提笔之前先祝你身体健康，新年愉快。\n\n　　孙强几次来信，他和家人都好，请放心。\n\n　　元月3日晚〔字迹不清〕，〔字迹不清〕。〔字迹不清〕大约在元月〔字迹不清〕号回去，现在，我们在〔字迹不清〕。〔字迹不清〕现在家里又吃药和休息。再有〔字迹不清〕住进海员医院，他想出院，但医生还说再住一段时候。\n\n　　我大约13号要去搞安装电灯线。今年我不打算回家过年，春节后再回去。现有一事和你商量。购买18寸全彩〔电视机〕〔字迹不清〕。我准备〔字迹不清〕电视机，〔字迹不清〕如果有什么朋友〔字迹不清〕，〔字迹不清〕电视机〔字迹不清〕牌子，价钱如何，〔字迹不清〕。可以的话请帮忙问问。〔字迹不清〕。钱交给你家人或你回来后给你，〔字迹不清〕，主要〔字迹不清〕用人民币交易。\n\n　　对于个人问题〔字迹不清〕，波折很大，现〔字迹不清〕认识一个，但发展不理想。今年春节〔字迹不清〕，并等你的回答。信〔写？〕到此，不必再谈。\n\n　　祝你在新的一年里一帆风顺！\n\n　　　　　　　　　　　　　　　　　　　　　　〔*〕\n　　　　　　　　　　　　　　　　　　　　　　元．4号．\n\n地址：〔字迹不清，字样中似有“凤凰村”〕",
			"revision_note": "",
			"tags": [
				"明家的信"
			],
			"place_display": "",
			"place_filters": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-004",
			"object_type": "LET",
			"title": "工作收入和琐事",
			"date_display": "1988",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-004/front-public.jpg",
				"/archive/LJM-20260829-LET-004/back-public.jpg"
			],
			"collection_code": "LET_1988",
			"accession_date": "2026-08-29",
			"batch_id": "FSA-20260829-CCQ",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "佛山天光墟",
			"created_date": "2026-09-05",
			"updated_date": "2026-09-05",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "",
			"transcription": "*：\n\n你好！【离校】4月9日返到惠州了吗？今我\n一切如常，勿挂念。\n\n关于【……】（做工）一事，【……】，曾可争取\n【……】你之所讲，加上父母指示，才改变，不过现还\n【……】，千万别【……】，开心则可。【……】每月30元，兼做【……】\n（做一些【……】工作，增加10—20元），不过总的【……】\n以后再倾，【……】情况好【……】，这些也知\n道，我当然同意你们【……】，其他没有【……】\n【……】。\n\n关于【……】一事，待你休假后办。我曾会\n说了，我面对【……】，这又烦麻烦你们。你若\n【……】，不必【……】，好吗？\n\n\n我爱人过几天来【能够】休假，只有恨你不能碰见，\n【深深】好似如梦一样。\n\n**（附）**我的工作已经【……】，以后【……】\n【……】；你【……】的就【……】。再注意\n身体，不要【……】下去。\n\n此致：\n\n【四字祝语，字迹较难辨】\n\n**\n\n83.4.11",
			"revision_note": "",
			"tags": [
				"明家的信"
			],
			"place_filters": [],
			"place_display": "惠州，广州"
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-005",
			"object_type": "LET",
			"title": "给明的回信19961109",
			"date_display": "1996",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-005/front-public.jpg",
				"/archive/LJM-20260829-LET-005/back-public.jpg"
			],
			"collection_code": "LET_1996",
			"accession_date": "2026-08-29",
			"batch_id": "FSA-20260829-CCQ",
			"acquisition_method": "PR-PUR",
			"physical_location": "佛山",
			"source_name": "旧货市场老板",
			"source_place": "佛山天光墟护红巷",
			"province": "广东省",
			"city": "广州市",
			"district": "荔湾区",
			"created_date": "2026-09-05",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1996-11-09",
			"date_end": "1996-11-09",
			"time_notes": "据back-public.jpg 手写落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20260829-LET-005/back-public.jpg 手写落款：日期 1996-11-09。；原有省市为广东省广州市，补齐国家层级，不改动原省市与区县。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "",
			"transcription": "亲爱的**：\n\n您好！你在十月份给我的来信收到了，阅了你信中详细内容，使我知道你在船上的一切，我感到很安慰。\n\n至今你离家已有二个半月了；家里的一切都比较正常。有关【荔溪南？】的房屋至今还没有租出，主要是很难分出房和厅，有人出到700元，对于我讲我都认为不理想，如果里装修改过就可以租出1200.00元，现在已放空一个月有多的日子，我同【厚志森？】讲过，要多少钱搞好，他讲【……】，如果【……】他会帮手装修，我的意思就理想，唔知你的意见如何。\n\n亚明：关于亚华的学习情况，今次他测验就下降了，语文81分，英语90分，英语听力比较差，这都是录音机很难听得清。你最好去外国买部比较好的录音机。\n\n去十一月五日去开家长会，老师讲【……】中的问题，是电脑【……】，增强【……】只有二十几位，是全级优秀学生【……】，是主要的表现，最好你有空就多些写信鼓励他，他好多时讲老豆没有信写比他，我【……】写【……】比爸爸知道【……】。\n\n亚明：对于我的身体都是比较差，亚爸走了，我就比较辛苦，上班【……】，每个月都没有上齐班，现在我想过是做得一时得一时，实真是做不到我就不做，唔知你会不会怪我不去打工，时间比较夜，再次再谈，再见！\n\n此致\n\n夫妻之吻。\n\n你的妻子**。\n\n1996年11月9日晚草。",
			"revision_note": "",
			"place_display": "",
			"place_filters": [],
			"tags": [
				"明家的信",
				"家书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-006",
			"object_type": "LET",
			"title": "不必再叙，偏偏都在信里",
			"date_display": "1988",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-006/front-public.jpg",
				"/archive/LJM-20260829-LET-006/back-public.jpg"
			],
			"collection_code": "LET_1988",
			"accession_date": "2026-08-29",
			"batch_id": "FSA-20260829-302",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场",
			"source_place": "佛山护红巷天光墟",
			"scan_date": "2026-09-05",
			"scan_ppi": 600,
			"physical_location": "佛山",
			"created_date": "2026-09-06",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"province": "广东省",
			"city": "肇庆市",
			"district": "封开县",
			"place_notes": "信末回信信息与信笺抬头共同指向广东封开；仅记录到县级，不抄录私人地址。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "front-public.jpg 和 back-public.jpg 的信笺抬头为广东省封开县水泥厂，回信信息亦写封开县。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "嘴上说“其他少谈”，却把婚事、春耕和惦记，一笔一画都寄给了你。",
			"transcription": "亲爱的弟媳：您好！\n    自从你们回返老家去广州，已经\n没有[无法辨认]，只有[无法辨认]时，\n叫他带一些土食品给您，但[无法辨认]，\n不知道啥处，这是顺便谈一下。没有\n谈正题之前，预祝你们今年春节过\n得好，生活愉快，祝你们大小身体健康，万\n事如意，永远平安！\n\n    弟妇：现在我写信给您，告诉您知\n道，[无法辨认]在农历二月十一日结婚，\n看您是否回老家参加他的婚礼。如果，您\n是无法回来[疑似：地]，其他不要买啥，这是农村\n兄弟[无法辨认]，应该您把25[无法辨认]\n[无法辨认]另一方面就是[无法辨认]已经从东莞[无法辨认]\n[无法辨认]，我们[疑似：俩]为父母是无法控制她。当天\n过年以后打工的辛苦，请您不要去[疑似：责]，同时\n农村正是春耕大忙季节，[无法辨认]\n时候，[无法辨认]。目前家中大小身体\n健康，[疑似：最小]侄儿子慧也去读书了，只有[无法辨认]\n[无法辨认]，对我的工作就在纸厂\n[无法辨认]工作。请您不要为我们担\n心，安心工作，带好侄儿亚华为好一。\n其他少谈，这些[疑似：闲笔]，不必再叙。\n\n        此致\n\n            敬礼\n\n        祝您工作心事舒畅，\n\n        身体健康！\n\n                            大伯：**\n\n                    一九八八年农历二月初三[疑似：晚]\n\n复信地址：封开县莲都镇文华[无法辨认]村\n                    [无法辨认]，",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-007",
			"object_type": "LET",
			"title": "电话要中午打，想念随时都在",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-007/front-public.jpg",
				"/archive/LJM-20260829-LET-007/back-public.jpg"
			],
			"collection_code": "LET_1992",
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-303",
			"accession_date": "2026-08-29",
			"physical_location": "佛山",
			"source_name": "旧货市场",
			"source_place": "佛山护红巷天光墟",
			"scan_date": "2026-09-05",
			"scan_ppi": 600,
			"backup_status": "BU1",
			"created_date": "2026-09-06",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-05-13",
			"date_end": "1992-05-13",
			"time_notes": "据front-public.jpg 与 back-public.jpg 落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20260829-LET-007/front-public.jpg 与 back-public.jpg 落款：日期 1992-05-13。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "她把想念藏进印刷厂的午休、孩子的考分和那间还没起好的房里，句句家常，句句都在等你。",
			"transcription": "**：\n    您好！你的来信今天我已收到了，阅了你的来信我很\n高兴。在来信方面，我在家里就安心了，至此，我万分感谢你对\n我和孩子的关心。并衷心祝你在南高渔校努力学习，争取好\n成绩。\n\n    凡明：对于我上次的来信你说写什么时间可以打电话，\n如果你打电话来印刷厂时最好在星期一至五，因为星期六和日\n两天要带亚华，你有时间的话在中午打来，有时开机台听不到\n电话响，中午是食饭时间。同时，亚华的学习情况，在第六单元\n测验[疑似：竟]考上100分，他在学校奖了一支铅笔和一本印有校章的簿他\n很高兴，我到学校接他时一见面就讲我知，我要他努力学习，\n争取期末考试好成绩，这次考试是升学试。\n\n    对于去[疑似：荔溪]看约买的房屋，现在还没有起[无法辨认]，这方\n面你回来都唔知起好，其他的事我在5月6日给你去信已谈，\n我想不作多谈了。最后，我还问这两个多月有没有失眠，你\n一定要注意好休息。[无法辨认]我知道[无法辨认]你安心学习，注意身体。\n再见！\n 此致\n\n    礼\n\n                                      妻子  **\n                                      1992年5月13日晚上。\n\n\n爸爸：\n    您好！你给我的信已收到，我很高兴，阅知你\n的情况，祝你学习进步。\n    爸爸：我今次测验全考上100分，数学92分，语文科奖一支\n笔和一本簿，我争取下次能继续努力。再见！\n\n                                      此致\n\n        敬礼\n\n                                孩子***写\n                                1992年五月13日晚",
			"revision_note": "",
			"tags": [
				"明的家书",
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-008",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "没有什么大事",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-008/front-public.jpg",
				"/archive/LJM-20260829-LET-008/back-public.jpg"
			],
			"collection_code": "LET_1992",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-303",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-07",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-05-06",
			"date_end": "1992-05-06",
			"time_notes": "据back-public.jpg 手写落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20260829-LET-008/back-public.jpg 手写落款：日期 1992-05-06。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "没什么大事，只是把家里的每一件小事，都写给你。",
			"transcription": "**：\n\n您好！你于五月一日给我的来信已收到，但是已知你的一切情况，我深感很高兴。再祝你保重身体，生活愉快，学习顺利。\n\n**亚明：**你在伦敦捎到给我的第二封信我没有回信，我在四月十日已给你寄第二封信，五月三日又给你第三封信，你怪我没有写信给你就错，我事实写封给你是太少，对不起，请你原谅吧。\n\n明：对于家里的事来讲，亚贤在四月初已经来了我家住，因为阿志来同他打架，要赶他走，不让他回去，但他没有办法，好来我家住。梁志【？】的父母亲不想亚昌和亚贤在她家住，但是亚昌逢休息都同她去饮茶，她就是认钱不认人，她的父【亲】一样这样说。他两个【打架之后一段字迹不清，且有墨迹遮挡】。我整有几天晚上都不好，我心里很烦。\n\n别的，对于亚华的学习情况，他去读【字迹不清】，英语第一单元97分，英语第二单元95分，数学第一次90.5分。数学是比较差，数学在中旬口算比赛，比赛情况：标准合格，1号做对50题要求23分钟，优秀标准100题23分钟，是上学期，他23分钟可以做对120题；2号，标准合格做对50题是23分钟，优秀标准90题23分钟，他要13分钟；3号合格标准50题23分钟，优秀标准80题23分钟，他要13分钟。\n\n我每天晚上都要同他复习，对于亚华管教我会管好，请你放心，你要安心学习。\n\n对于房屋方面，房租要升价，原来每平方0.30元升到0.50元，是1989年9月31日前分配，1989年10月1日分配到是原来每平方2.60元升到5.86元，是由六月一日开始，四月份收到通知。住房超过15平方就按商品房的价格，每平方1.60元，如果房屋不买就要交价格，买的话就要工资的百分之几来买，是扣工资。公司发了表格，我的意见就不想买，因为这间房不是【字迹不清】套间。\n\n我先征求你的意见，你买不买都要尽快答复。【关于单位工资、扣除房租一段字迹较难辨】三月份扣除房租有【？】佰元，四月份有【？】佰【？】拾元。\n\n同时我的身体目前已恢复正常，请你安心学习。我开了电话号码是 8817880，梁志森的电话号码 8831210。别的少谈，再次再见。\n\n此致\n\n敬礼\n\n**\n1992年5月6日写",
			"revision_note": "",
			"tags": [
				"明家的信",
				"明的家书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-009",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "唠唠嗦嗦谈家常",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-009/front-public.jpg",
				"/archive/LJM-20260829-LET-009/back-public.jpg"
			],
			"collection_code": "LET_1992",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-304",
			"province": "广东省",
			"city": "广州市",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-07",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"last_research_date": "2026-10-13",
			"evidence_basis": "根据原记录已填写的广东省、广州市补齐国家，不覆盖既有地点判断。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "都是些小事，小到最后才发现，写的其实都是挂念",
			"transcription": "阿华：\n\n您好！你会猜到我收到你来信吗？其实【字迹不清】\n的我早已收到，由于学习比较忙，不能速回信，请\n千万原谅。\n\n嗯，学习和生活还忙吗？如果学习忙的话，【无？】\n必要急着回信，姐姐不会介意哦，你都会知道咯。\n姐姐一直希望你做个好学生，在家也要做个好孩\n子，咁样姐姐就放心咯！\n\n你寄来的相我已经寄给飞姐了，不过我还没有\n收到飞姐的信。不过你放心，我和飞姐【字迹不清】帮\n你在爷爷、姑妈、姐姐面前讲好话咯，而且你讲\n下次有机会再同她们影【相？】咯，我希望你不要放在\n心里，好吗！\n\n华，你又有认真看我写给你的信吗，我叫你寄\n【字迹不清】相给我，你怎会寄飞姐【七？】相给我睇，不过\n都有【字迹不清】咯，如果你在广州有【字迹不清】，你还\n会寄给我留念吗！\n\n你写有回信给爷爷，或许爷爷在家里等你\n的照片呢？因为你帮他影有相，我猜他一定很想着，\n他一直都很挂住你。姐姐在家的时候，他经\n常问你有冇写信给我呢！加上趁你在家时，\n你都几【字迹不清】勤力，实会令到他很高兴。\n\n第二页\n\n好了，姐姐这次写信都没有什么好讲，唠\n唠嗦嗦谈了一下家常。最后，请你代我向你爸爸妈\n妈问候，并且话你爸爸妈妈，爷爷、阿伯、阿母、\n姐姐、哥哥都很好，请不要挂念。\n\n祝：\n生活愉快\n学习猛进\n身体健康\n快高长大\n\n姐姐： 【名字第二字不清】\n五月23号",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-010",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "六月四日晚，匆匆写下的几句话",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-010/front-public.jpg"
			],
			"collection_code": "LET_1992",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"batch_id": "FSA-20260829-304",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"created_date": "2026-09-07",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-06-04",
			"date_end": "1992-06-04",
			"time_notes": "据front-public.jpg 手写落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"province": "广东省",
			"city": "广州市",
			"place_notes": "正文记述来访者从江门来到广州家中，据此判断书写时关联广州；不记录住址。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20260829-LET-010/front-public.jpg 手写落款：日期 1992-06-04。；front-public.jpg 正文广州来访叙述及1992年6月4日晚落款。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "那些看似琐碎的叮嘱，后来都成了一个家的年月。",
			"transcription": "**：\n\n　　你好！你的来信已顺利收到了，阅信中所详细内容，使我获知你的情况。你在五月二十三日给我的电话之后，虽然电话谈的时间不长，使我聆听到你的声音，我心里感到很高兴。\n\n　　关于亚贤找房的问题已经抓紧找的，他已找到一间，现已要等对方房主答复，请你安心学习为好。别的，有关荔湾南的屋已经搞好了，开发公司的负责人说，八月份可能就会回迁。同时亚华在六月二日从江门出来广州来我家，她说过两天回去江门。\n\n　　最后，对于亚华的学习情况，今次测验93分，我每天都抓紧同他复习，我已经尽自己的【涂改处】能力去教，我【涂改处】刚好同他复习完，时间比较晚，别的少谈。下次再谈。\n\n　　再见！\n\n　　　　　　　　　　　　　　　　　此致\n\n敬礼\n\n　　　　　　　　　　　　　　　　　你的妻子****\n\n　　　　　　　　　　　　　　　1992年6月4日晚急草",
			"revision_note": "",
			"tags": [
				"明家的信",
				"明的家书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-011",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "留一点话，下封信再讲",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-011/front-public.jpg",
				"/archive/LJM-20260829-LET-011/back-public.jpg",
				"/archive/LJM-20260829-LET-011/detail-01-public.jpg"
			],
			"collection_code": "LET_1992",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"acquisition_method": "PR-PUR",
			"physical_location": "佛山",
			"batch_id": "FSA-20260829-306",
			"created_date": "2026-09-08",
			"updated_date": "2026-09-08",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "其余嘅嘢留在下次讲，我怕下次写信给你，没有话同你讲。",
			"transcription": "*仔：\n\n　　你和你妈妈还好吧！你的来信我收阅了。知道你的情况，姐姐感到很高兴。唔知姐姐咁耐冇回信，是否等得心急啊！姐姐觉得很对不起你，希望能谅解我现在的生活？好吗！\n\n　　哎，得知你的【字迹不清】学习成绩，姐姐为你而感到自豪、骄傲，因为姐姐有你咁叻仔嘅细佬。OK！！！希望你以后学习更上一层楼，奋发前进。【此处一行字迹较难辨】。因为姐姐希望是没用，【字迹不清】还要靠你自己，知道吗？不要偷懒哦。\n\n　　你注意保好身体，唔知【字迹不清】，姐姐可能【字迹不清】，姐姐不要上课，告诉她一声吧！姐姐在26号就请假回家。唔知你同妈妈一起回家吗！如果系咁样，我为你同【字迹不清】高兴。如果你学习忙的话，就不要回来了。不回家【字迹不清】，你自己注意多休息啊！不要妈妈担心你。OK！\n\n　　姐姐讲咗咁耐，几得几啰嗦，真不知讲咩好。至于我现在情况，都几好啊！请勿挂念，我会照顾自己啦！因为姐姐大个女啦，【疑：俾你挂心些】。\n\n　　喂，姐姐学校里举行“庆国庆”的“篮球赛”，你猜得中姐姐有份吗？你一定会话姐姐咁矮，边有份喇！其实，姐姐球技都几好，如果你有看见呢？包你为我鼓掌。唔知姐姐话俾你知，是否在广州【字迹不清】姐打气啊！\n\n　　好喇，姐姐这次回信就谈到此，至于其余嘅嘢留在下次讲，我怕下次写信给你，没有话同你讲。\n\n　　　　　　　　　　　　boy-boy.\n\n祝：\n　　学习进步\n　　快高长大\n　　身体健康。\n\n愿：\n　　你同妈妈，开开心心地生活，永远\n　　笑不停。\n\n　　　　　　　　　　　　　　姐：**\n　　　　　　　　　　　　　　于10月17号",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-012",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "一万元钱，和一辈子的感谢",
			"date_display": "1988",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-012/front-public.jpg",
				"/archive/LJM-20260829-LET-012/back-public.jpg"
			],
			"collection_code": "LET_1988",
			"batch_id": "FSA-20260829-307",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"province": "广东省",
			"city": "广州市",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-08",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"last_research_date": "2026-10-13",
			"evidence_basis": "根据原记录已填写的广东省、广州市补齐国家，不覆盖既有地点判断。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "成年人的难处，大概就是开口求人之前，先把一辈子的感谢都说完。",
			"transcription": "*弟您好：\n\n　　想，我们的分别时之情景，真是使我的伤感，使我感恩不尽。而是你为愚兄而奔忙，真是太麻烦你与弟妹；十多日许的为我奔波，想办法，拿主意，每天都在为我操劳，真是使我永世难忘，衷心的感谢！\n\n　　话别分别后，我一路顺风的到家了。到家后，我把房子一事定了下来，可我的经济又是十分紧张。这次【字迹不清】，又是我的时运不佳，所以只得求【字迹不清】、阿明弟，为愚兄帮忙解难；我的房钱，房主要我在88年11月末到12月初【字迹不清】15000元。这无疑给愚兄是一大难题，而且在时间上又是十分紧张。这样愚兄才不得求你和【字迹不清】尽快的想办法，在不影响你的身体健康及正常的家庭生活的情况下，最好尽量的早些，在11月末，或12月初能为我的手头需有1万元（10000元）钱为好。\n\n　　如能按期为我办成，我代表我全家和我父，今生今世，我是永不会忘记阿明弟对我的帮助的大恩大德，衷心的感谢；如能办妥，在邮钱的同时麻烦阿明弟来个电报，在电报上不要写有钱数，我认为最好即可。再一次我衷心表示感谢！\n\n　　【字迹不清】也是经济也紧张，时间也紧张，又不知【字迹不清】公司又来电报，所以希望阿明弟为我多想些办法！尽量千方百计的早日为我办妥；有朝一日，忠心报答阿弟的恩情。\n\n敬祝：\n　　祝您全家好！\n\n　　　　　　　　　　　　　　愚兄　***\n\n　　　　　　　　　　　　　　88.11.12",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-013",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "船在天津，家在信里",
			"date_display": "1987",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-013/front-public.jpg",
				"/archive/LJM-20260829-LET-013/back-public.jpg",
				"/archive/LJM-20260829-LET-013/detail-01-public.jpg",
				"/archive/LJM-20260829-LET-013/detail-02-public.jpg"
			],
			"collection_code": "LET_1987",
			"batch_id": "FSA-20260829-309",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"province": "天津市",
			"city": "天津市",
			"specific_place": "天津锚地",
			"place_notes": "据末页落款及正文所述船舶停泊天津记录书写地点。",
			"time_notes": "末页落款可确认1987年7月，具体日数不清，不补造日期。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "detail-02-public.jpg 落款与front-public.jpg 行程说明；公文字样“上海”是纸张出品标记，不是写信地点。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "离家快两年，他写了四页，最重的一句不是想念，是“我很对不起你和孩子”。",
			"transcription": "亲爱的*：\n\n　　你和孩子好！自从我轮船在大连港锚泊之前，我曾经草几封信给你。估计，这些信已顺利收到。给你寄信之后，随后我轮船六月二十二日离开大连锚泊，开往天津方向装货。到达天津锚泊之后，办好装货计划及安排，【字迹不清】，一直半个月都锚泊等待【字迹不清】。等待期间，由于我【所在的】是外籍船舶，【岸上】交通很是困难的。这样，你我交通不便，对我们给家寄信带来困难。因此，特向你道歉，表示很对不起，愿你能够谅解为盼。\n\n　　萍：至今我离开家里快要二年的时间了。两年的时间里，家庭的确太辛苦了，我很对不起你和孩子。在整【这】年的时间里，对于你又要工作，又要照顾孩子、教育孩子的双重负担，一般女人是难于吃得苦的。因此，【以下数句字迹不清】。辛苦你啦！【字迹不清】，辛苦你吃苦了。但是，作为丈夫，【字迹不清】，为此，我表示十分的感谢。\n\n　　对于外出【这】一年的时间里，我对于家里的情况【字迹不清】，我认为作为一个丈夫，我没有【完全】做到【字迹不清】，本人感到很惭愧，很对不起你。当然，对于我今后的【字迹不清】，这是【字迹不清】造成，人鲜在事后能【字迹不清】。对于以后来讲，由于这几年的事物，人要【字迹不清】，我想第一要能【字迹不清】，由我【字迹不清】去做。这样，家庭之事不管哪一个人都应该有个分工和地位，不管贫或富都要爱。家庭是每个人在世界中都有推动作用，是社会组成的。所以，对于我以后的时间里，关于家庭的情况很多我是想过的，是我的思想未成熟以前，时时刻刻会有【字迹不清】，会叫辛苦的日子【字迹不清】。当然，这种担心毕竟是多余的，因为，千里远，【字迹不清】，事情有时是难的。【字迹不清】\n\n　　【第三页开头数行字迹较难辨】……但也有信捎带到我的船上，【字迹不清】。俗话说：【字迹不清】叶落归根。【字迹不清】，所以那些人在异乡【字迹不清】。除了你以外，陪伴人的则不多。【字迹不清】\n\n　　【关于今后的生活】我们夫妻到今同期一年中要【字迹不清】，对于你以后【字迹不清】，除【字迹不清】日同家人团聚，【字迹不清】。如果我能再跑一个航次，有能换班的话，【字迹不清】。现在来本船以后，船长的思想状况【字迹不清】，所以对今后【字迹不清】。当然，这方面不是我的问题，一切都是由船运公司所决定的。由于我新【字迹不清】，以后事情的发展【字迹不清】，所以，目前唯一能做的【字迹不清】，这样，或许得到一个【字迹不清】回来吧。\n\n　　我希望本人多一点【字迹不清】，到最后坚持【字迹不清】，希望完成交给我们的任务，有更多努力。对于你方面，我有些事要求你：【字迹不清】，教育好孩子，多保重身体，【字迹不清】，防止病毒的感染。相爱夫妻在分别后的生活中，更应该互相体谅和支持。这样，我也没有什么担心了。\n\n　　对于我方面来讲，最近的情况身体正常，工作比较顺利，心情也比较愉快，别的少谈。由于我轮船锚泊时间较长，以后会有【通信】困难，又【字迹不清】。对于我的【饮食】，不知道你是否关心。由此一来，我感到你【字迹不清】平常时的饮食，这样，【字迹不清】。不过，这方面你不要为我担心，我是能吃得饱的，身体健康就是了。\n\n　　别的来讲，由于来往航行内【通信】没有确保，其余的事我不要啰嗦了。\n\n　　再见！\n\n　　　　　　　　　　　　　　　　此致\n\n敬礼\n\n　　　　　　　　　　　　　　　　丈夫【署名字迹不清】\n\n　　　　　　　　　　　　　　　　1987年7月【日期不清】\n　　　　　　　　　　　　　　　　于天津锚泊【末字据字形判断】",
			"revision_note": "",
			"tags": [
				"明的家书",
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-014",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"date_display": "1995",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-014/front-public.jpg",
				"/archive/LJM-20260829-LET-014/back-public.jpg"
			],
			"collection_code": "LET_1995",
			"title": "亲爱的吻",
			"batch_id": "FSA-20260829-309",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"created_date": "2026-09-13",
			"updated_date": "2026-09-13",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "前面都在说胃药、活络油和金项链，临了才想起来，还是要亲一下",
			"transcription": "亲爱的**：\n\n您好！你于八月三十一日给我的信已经收到了，\n你信中的详细内容，我感到很安心，愿祝你航\n程一切顺利。\n\n**：**对于你信中提出【美元？】的事，家里是有\n【字迹不清】，你是拿了【字迹不清】，我问你拿不拿，你说不拿等船\n上可能有发，请你放心工作。别的，【人名不清】两个人和两\n个同学来广州买结婚衫来【字迹不清】，二十一日到二十四日走，她的\n母亲要我到【人名不清】结婚的日子回去，她说，因为【人名不清】今\n年三十一岁【字迹不清】女儿出嫁，所以要我回去帮她手，\n就比较好。如果【字迹不清】又没有人照顾，去又【字迹不清】，\n最好你的意见给我。\n\n**亚明：**有关我的身体又不是好好，颈部【字迹不清】好多，\n胃痛方面每天都要食胃药，如果去看病【字迹不清】，要\n照胃；我又怕辛苦，自己唯有是痛就食药，注意饮食\n就没有事，请你放心，不要为我担心。\n\n****：**对于孩子的身体很好，读书的问题，\n语文、数学都是保持四年级一样，英语测验到的\n分数是95分。别的，关于要你去新加坡买的东西，\n你最紧要买几支活络油，买一条金项链，一对耳环，\n我这条金项链和耳环【字迹不清】亚飞拿回去，你要同我买回一\n条大一些。同时孩子要你【字迹不清】买部插带电子游戏机。\n\n关于【字迹不清】的房要交钱，九月二十七日至十月二十七日止，如果\n迟交的话，就要加收到百分之十七。别的事，因时间\n比较夜，下次再谈吧。再见！\n\n此致\n\n亲爱的吻\n\n祝你身体健康、生活\n愉快，工作顺利，\n出入平安。\n\n你的妻子：*\n\n一九九五年九月二十四日",
			"revision_note": "",
			"tags": [
				"明家的信",
				"明的家书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-015",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "回家一个星期",
			"date_display": "1996",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-015/front-public.jpg",
				"/archive/LJM-20260829-LET-015/back-public.jpg"
			],
			"collection_code": "LET_1996",
			"physical_location": "佛山",
			"date_start": "1996-10-27",
			"date_end": "1996-10-27",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-310",
			"created_date": "2026-09-13",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"province": "广东省",
			"city": "广州市",
			"place_notes": "正文自述在广州，据此填写城市；未将收件人的工作地点或私人地址写入。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "front-public.jpg 正文“我在广州”与现有公开转录对应。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "人总以为回家是句号，真回来了，才发现还得继续想下一程。",
			"transcription": "*婶：\n\n　　您好！在我落笔之前，祝您和亚平身体健康、生活愉快、工作顺利，一切如意。\n\n　　婶！我翻来家乡已经有一个星期了。现在先写信俾您，请您的原谅我。由于回来比较忙，抽了些时间写信，因此依家先写信给您。\n\n　　亚婵！我都唔知点样多谢您同阿敏。在您的帮助、鼓励同支持我，我在人生路不至于【字迹不清】，学懂许多东西，在快乐、烦恼中度过了几个月，依家想起都真有D害怕。\n\n　　婶，时间过得快，我回来这几天里，我想过落去下边揾工做，因为在家里觉得很闷，时间又难过，都唔知点算好！气哎！阿叔写信俾我老豆，他讲他在新加坡，佢讲时间比较紧，在新加坡时间【字迹不清】又要走了，大约去印度，我都不清楚。\n\n　　婶：您依家的生活几好呢！华刚学习情况应该唔错吧！婵，我睇到您忙忙碌碌地工作，真系令到人担心，我在广州又帮不了什么，只好自己【字迹不清】，没有用。依家我只有希望您的D生意蓬勃发展，不要过于疲劳自己，好吗！\n\n　　婶，爸爸的身体都比较好，可以走来走去，【疑：唞气】、走路没有以前那样方便，请您放心。至于建楼装修的事已经搞得七七八八了。\n\n　　好啦！由于时间有限，我今次写信在此停笔。有事来信再谈吧！再见。\n\n此致\n\n　　　　　　　　　　　　　　敬礼\n\n　　　　　　　　　　　　　**\n\n　　　　　　　　　　　　　　于96年10月27号",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-016",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "想去玩都几困难",
			"date_display": "1992",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX2",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-016/front-public.jpg"
			],
			"collection_code": "LET_1992",
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-310",
			"physical_location": "佛山",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"date_start": "1992",
			"created_date": "2026-09-15",
			"updated_date": "2026-09-15",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"transcription": "阿*：\n\n　　唔知你依家做紧乜嘢，作业应该做了吧？要唔要我在放假个时候同你检查啊！\n\n　　乜嘢！好久冇同你倾计啦。现时！依家我好想知道你的近况，因为我现在很闷，想同你倾计啫！但系我唔会阻住你温书。你都知道我好识做嘛！\n\n　　好啦！话多无谓，就讲一下我依家嘅近况吧。我依家翻屋企觉得都几烦，回来帮阿母种田冇钱收入，想去玩都几困难。所以话呢，做人难啊！我回来家乡，到依家先写信给你，你嬲我吗！我知道你不会嬲我的！\n\n　　喂！你做作业要注意一点，认真D先得。好易粗心大意，好容易做错题㗎，知道冇！\n\n　　好啦，有闲暇的时候做完作业睇电视。回信再倾，好吗！\n\n　　再见……\n\n祝：\n　　学习猛进\n　　身体安康\n　　生活愉快\n\n　　　　　　　　　　　　　　10月27号晚\n　　　　　　　　　　　　　　芳姐敬上",
			"revision_note": "",
			"tags": [
				"明家的信"
			],
			"description": "她说做人难，难到想出去玩都要掂量；可自己的日子再烦，也没忘记叮嘱弟弟——作业别粗心。"
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260829-LET-017",
			"accession_date": "2026-08-29",
			"object_type": "LET",
			"title": "“此致”不是“致此”",
			"date_display": "1995",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260829-LET-017/front-public.jpg",
				"/archive/LJM-20260829-LET-017/back-public.jpg"
			],
			"collection_code": "LET_1995",
			"batch_id": "FSA-20260829-311",
			"acquisition_method": "PR-PUR",
			"physical_location": "佛山",
			"date_start": "1995-08-21",
			"date_end": "1995-08-21",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-16",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "美国",
			"place_notes": "back-public.jpg 落款“于美国”；未出现可以确定州或城市的线索。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "back-public.jpg：1995年8月21日于美国；现有具体日期保持。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "他隔着半个地球写信回来，先问成绩，再教做人，最后还不忘改一个写反的“此致”。",
			"transcription": "心爱的*儿：\n\n　　你好！你在七月11号给我来信已收到了。在你的来信中，我知道你在期末考取了班中第六名，被评为“三好”学生，爸爸感到非常的高兴。\n\n　　对于你在信中提出要求，如果爸爸条件许可的，我尽量满足你的要求。请你在家里放心读好书吧！\n\n　　华儿：新的一学年快要开学了，爸爸希望你要发奋刻苦学习的精神，虚心向别人好的方面学习，千万不要骄傲自满，要乘胜学习，争取学习的前茅。在学校里，要尊师，团结同学，积极参加学校各项有意义的活动，热爱集体，热爱社会，学好文化，做一个出色而有才能的革命接班人。\n\n　　在家里，好好地听妈妈的话，不但完成老师布置课外作业，有空也看书本学习。在适当的时间里，帮助妈妈做一些家务小工作，做一个【疑：关心和现实】的好孩子。\n\n　　华儿：爸爸在船上工作是比较忙的，其他的东西我就少谈了。最后预祝在新的一学年里，身体健康，学习进步！\n\n　　　　　　　　　　　　　　　　此致\n\n爸爸的吻\n\n　　　　　　　　　　　　　　　　你的爸爸　***\n\n　　　　　　　　　　　　　　　　1995年8月21日于美国\n\n**注：**在你一次来信中结尾的“致此”是【疑：颠错了】，正确的写法是“此致”，不是“致此”，希望你今后写信改正过来就是了。",
			"revision_note": "",
			"tags": [
				"明家的信",
				"明的家书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260906-IDC-001",
			"accession_date": "2026-09-06",
			"object_type": "IDC",
			"date_display": "1994",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260906-IDC-001/front-public.jpg",
				"/archive/LJM-20260906-IDC-001/back-public.jpg"
			],
			"collection_code": "IDC_1994_LIC_ORI_SLD+COL+DYE_EXP",
			"batch_id": "FSA-20260808-401",
			"title": "她与未来握过一次手",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"source_name": "旧货市场老板",
			"source_place": "佛山护红巷天光墟",
			"carrier": "MT-SLD",
			"color": "CL-COL",
			"process": "PC-DYE",
			"scan_date": "2026-09-06",
			"scan_ppi": 600,
			"province": "广东省",
			"city": "广州市",
			"created_date": "2026-09-06",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"time_notes": "具体签发日期据证书内页落款；培训起止日期与出生日期是不同概念，本次不增加个人出生信息。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "front-public.jpg：培训单位印章及签发日期；back-public.jpg 为广州市劳动局制证封面。"
		},
		"metadata": {
			"schema": "credential",
			"dimensions": {
				"ID01": {
					"credential_type": "ID-LIC"
				},
				"ID09": {
					"portrait_status": "IP-ORI"
				},
				"ID20": {
					"credential_status": "CS-EXP"
				},
				"ID02": {
					"credential_function": [
						"电脑操作"
					]
				},
				"ID10": {
					"birth_date": "1994-06-15",
					"sex_text": "女",
					"nationality": "中国"
				},
				"ID04": {
					"issuing_place": "广州"
				},
				"ID14": {
					"language": [
						"中文"
					]
				},
				"ID03": {
					"issuing_organization": [
						"中山大学大气科学系"
					]
				},
				"ID05": {
					"issue_date": "1994-06-15"
				}
			}
		},
		"public_view": {
			"description": "1994年，她通过了电脑操作考试。三十二年后，我们还在被电脑操作。",
			"transcription": "",
			"revision_note": "",
			"tags": [
				"技能证书"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260906-NTB-001",
			"accession_date": "2026-09-06",
			"object_type": "NTB",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260906-NTB-001/front-public.jpg",
				"/archive/LJM-20260906-NTB-001/back-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-01-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-02-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-03-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-04-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-05-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-06-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-07-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-08-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-09-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-10-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-11-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-12-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-13-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-14-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-15-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-16-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-17-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-18-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-19-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-20-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-21-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-22-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-23-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-24-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-25-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-26-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-27-public.jpg",
				"/archive/LJM-20260906-NTB-001/detail-28-public.jpg"
			],
			"collection_code": "NTB_1993_NOT_OTH_COM",
			"title": "一位基层干部的笔记本",
			"batch_id": "FSA-20260808-601",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"date_display": "1993",
			"source_name": "旧货市场",
			"source_place": "佛山护红巷天光墟",
			"themes": [
				"SU-OTH"
			],
			"event_scene": [
				"EV-WRK"
			],
			"scan_date": "2026-09-06",
			"scan_ppi": 600,
			"created_date": "2026-09-06",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"province": "广东省",
			"city": "梅州市",
			"district": "大埔县",
			"place_notes": "扉页纪念章出具机构为共青团大埔县委员会，按现行行政区划记录机构关联地；不证明本册所有内容都在大埔书写。",
			"time_notes": "扉页手写记为1993年4月14日至1995年2月25日；红色纪念章的1985年是赠发纪念信息，不作为正文书写年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "back-public.jpg 扉页手写时间与纪念章；正文可见中文记录和英文学习内容。；大埔现属梅州市，行政层级核对：https://www.gd.gov.cn/gdywdt/zwzt/bwychny/zcb/content/post_4714143.html"
		},
		"metadata": {
			"schema": "diary_notebook",
			"dimensions": {
				"DN01": {
					"notebook_type": "NB-NOT"
				},
				"DN19": {
					"notebook_completeness": "NC-COM"
				},
				"DN08": {
					"mentioned_places": [
						"工作",
						"感悟",
						"情感",
						"生活"
					]
				},
				"DN14": {
					"cover_material": [
						"塑封"
					]
				},
				"DN10": {
					"content_genres": [
						"摘抄、会议记录、账目、诗文"
					]
				},
				"DN02": {
					"content_date_start": "1993-04-14",
					"content_date_end": "1995-02-25"
				},
				"DN09": {
					"language": [
						"中文",
						"英文"
					],
					"writing_direction": [
						"横排，从左至右"
					]
				}
			}
		},
		"public_view": {
			"description": "1993年的年轻人，一边认真学英语、琢磨工作和处世，一边研究男女、爱情和自己，字写得越来越乱，心事却越来越多。",
			"transcription": "",
			"revision_note": "",
			"tags": [
				"笔记本",
				"记录",
				"文字"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260907-PHO-001",
			"accession_date": "2026-09-07",
			"object_type": "PHO",
			"title": "小时候就有点难搞",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260907-PHO-001/front-public.jpg"
			],
			"collection_code": "PHO_1990_CHD_FAM_NONE_C1+OTH_G",
			"batch_id": "FSA-20260808-101",
			"acquisition_method": "PR-PUR",
			"physical_location": "佛山",
			"date_display": "1990",
			"province": "广东省",
			"themes": [
				"SU-CHD"
			],
			"event_scene": [
				"EV-DLY"
			],
			"condition_grade": "C1",
			"condition_details": [
				"DM-OTH"
			],
			"scan_date": "2026-08-21",
			"scan_ppi": 600,
			"created_date": "2026-09-07",
			"updated_date": "2026-09-07",
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
			"description": "椅子不大，气场先坐满了",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20260909-LET-001",
			"accession_date": "2026-09-09",
			"object_type": "LET",
			"title": "我会慢慢改好的",
			"date_display": "1987",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R0",
			"evidence_level": "D",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20260909-LET-001/front-public.jpg",
				"/archive/LJM-20260909-LET-001/back-public.jpg"
			],
			"collection_code": "LET_1987",
			"physical_location": "佛山",
			"acquisition_method": "PR-PUR",
			"batch_id": "FSA-20260829-308",
			"scan_date": "2026-09-01",
			"scan_ppi": 600,
			"created_date": "2026-09-09",
			"updated_date": "2026-09-09",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。"
		},
		"metadata": {
			"schema": "common",
			"dimensions": {}
		},
		"public_view": {
			"description": "一个还在上学的女孩，因为成绩、家庭里的争执和自己犯过的错，给叔叔写了一封近乎“自我检讨”的信。她反复说“认识自己”“改正错误”“吸取教训”，但又不是公文式的检讨，里面有那种很年轻的委屈、自责和倔强。她把“对不起”写了两页，也把“长大”偷偷写在了里面。",
			"transcription": "亲爱的叔叔：\n\n　　您好！您的信已收到。我知道您和婶婶都很关心我，我衷心的感谢。对于这【字迹不清】，其实并不是这样，我的心情都很矛盾，因为我没有履行自己的诺言，请原谅。\n\n　　自从【字迹不清】以来，我【字迹不清】有很多次受打击的事，有时令我透不过气来，有时也打了心里的问号，是否自己做错了什么，又找不出原因。有一次我甚至自己【字迹不清】，把不愉快的事抛弃。对于【字迹不清】，我过去【字迹不清】，但是【字迹不清】，我已经【字迹不清】。\n\n　　【中间数行字迹较淡、连笔严重】……已经收到我的很大鼓励，我已经回到家。再者，在这几个月来，我【字迹不清】。我知道以后一定【字迹不清】，把那学校的差距追上去。对于这两件事，我再不需要【字迹不清】。我还要感谢您，使我认识了自己，认识自己以前有很多地方的不对，比如和弟妹吵架，和妈妈顶嘴等等！\n\n　　我以后一定会改正自己的错误。在这儿我才认识到自己的错误是那样严重，自己是很需要【字迹不清】的。对于婶婶的问题，我是【字迹不清】的。我并没有什么【字迹不清】，我知道【字迹不清】婶婶再也不关心我，我确实苦恼了。我只希望第二次再犯的错误根本不再出现在我身上，我已经吸取教训。\n\n　　我很要谢谢您，对我的学习关心和鼓励。我一定尽力而为。我祝您在新的一年里工作顺利，一帆风顺。【涂改处】在自己的信上的时间是打扰了，有地方不对的，请批评。\n\n　　再见！\n\n　　　　　　　　　　　　　　　　此致\n\n敬礼\n\n　　　　　　　　　　　　　　　　侄女：**\n\n　　　　　　　　　　　　　　　　1987年",
			"revision_note": "",
			"tags": [
				"明家的信"
			]
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-IDC-001",
			"accession_date": "2026-10-11",
			"object_type": "IDC",
			"title": "有些年月，会落在证书上",
			"date_display": "1982",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-IDC-001/front-public.jpg",
				"/archive/LJM-20261011-IDC-001/back-public.jpg"
			],
			"collection_code": "IDC_1982_LIC_ORI_ALB+BW+OTH_EXP",
			"batch_id": "FSA-20260808-402",
			"physical_location": "佛山",
			"carrier": "MT-ALB",
			"color": "CL-BW",
			"process": "PC-OTH",
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"province": "广东省",
			"city": "广州市",
			"place_notes": "按证书批准单位广州市卫生局记录审批机构所在城市，不作为持证人住址。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "front-public.jpg 批准单位印章；back-public.jpg 标有广东省卫生技术人员职称证书。"
		},
		"metadata": {
			"schema": "credential",
			"dimensions": {
				"ID01": {
					"credential_type": "ID-LIC"
				},
				"ID09": {
					"portrait_status": "IP-ORI"
				},
				"ID20": {
					"credential_status": "CS-EXP"
				},
				"ID10": {
					"sex_text": "女",
					"birth_date": "1942-07-15",
					"nationality": "中国"
				},
				"ID02": {
					"credential_function": [
						"职业资格证"
					]
				},
				"ID03": {
					"issuing_organization": [
						"广州市卫生局"
					]
				},
				"ID04": {
					"issuing_place": "广东省广州市"
				}
			}
		},
		"public_view": {
			"description": "红封皮打开，内页还保留着当时的书写与印章。旧物让那些具体的时刻有了着落。",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-IDC-002",
			"accession_date": "2026-10-11",
			"object_type": "IDC",
			"title": "一本证，翻过不少日子",
			"date_display": "1957",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-IDC-002/front-public.jpg",
				"/archive/LJM-20261011-IDC-002/back-public.jpg",
				"/archive/LJM-20261011-IDC-002/detail-01-public.jpg",
				"/archive/LJM-20261011-IDC-002/detail-02-public.jpg",
				"/archive/LJM-20261011-IDC-002/detail-03-public.jpg",
				"/archive/LJM-20261011-IDC-002/detail-04-public.jpg"
			],
			"collection_code": "IDC_1957_WRK_ORI_ALB+BW+OTH_EXP",
			"physical_location": "佛山",
			"batch_id": "FSA-20260808-403",
			"date_start": "1957-05-15",
			"country": "中国",
			"province": "广东省",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C3",
			"condition_details": [
				"DM-FAD",
				"DM-MOL",
				"DM-CRS",
				"DM-TRN",
				"DM-LSS",
				"DM-STK",
				"DM-STA",
				"DM-ABR",
				"DM-CUR",
				"DM-YEL"
			],
			"acquisition_method": "PR-PUR",
			"carrier": "MT-ALB",
			"color": "CL-BW",
			"process": "PC-OTH",
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_end": "1957-05-15",
			"time_notes": "发证日期栏写57年5月15日，结合既有1957年著录补全；不将入会日期或出生日期当作发证日期。",
			"organizations": [
				"广东省工会联合会"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "back-public.jpg 的发证日期栏和工会名称栏；机构名为工会名称，未将不清晰的手写发证单位作确定转录。"
		},
		"metadata": {
			"schema": "credential",
			"dimensions": {
				"ID01": {
					"credential_type": "ID-WRK"
				},
				"ID09": {
					"portrait_status": "IP-ORI"
				},
				"ID20": {
					"credential_status": "CS-EXP"
				},
				"ID02": {
					"credential_function": [
						"中华全国总工会会员证"
					]
				},
				"ID10": {
					"birth_date": "1931-10-12"
				},
				"ID05": {
					"issue_date": "1957-05-15"
				}
			}
		},
		"public_view": {
			"description": "封皮磨损了，会费栏还一格格留着笔迹。旧证件把那些没有被大声讲过的日常，保存得很具体。",
			"transcription": "",
			"revision_note": "",
			"tags": []
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "LET_1993年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1993-01-16",
			"date_end": "1993-01-16",
			"time_notes": "据back-public.jpg 手写落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-FAM"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20261011-LET-001/back-public.jpg 手写落款：日期 1993-01-16。；front-public.jpg 为生肖图案贺卡，back-public.jpg 为致父亲的新年祝语。"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "LET_1993年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1993-11-15",
			"date_end": "1993-11-15",
			"time_notes": "据front-public.jpg 与 back-public.jpg 两处落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"province": "天津市",
			"city": "天津市",
			"specific_place": "天津港",
			"place_notes": "正文明确提及天津港，作为内容关联地点；不是对书写地点或私人住址的认定。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20261011-LET-002/front-public.jpg 与 back-public.jpg 两处落款：日期 1993-11-15。；front-public.jpg 正文可见天津港；未转录姓名、签名或其他个人资料。"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "LET_1996年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1996-04-01",
			"date_end": "1996-04-01",
			"time_notes": "据front-public.jpg 通知落款补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"province": "广东省",
			"city": "广州市",
			"place_notes": "按落款广远人事教育处记录出具机构的关联城市；文中其他城市为考点，不作为本件地点。",
			"organizations": [
				"广州远洋运输公司人事教育处"
			],
			"themes": [
				"SU-LAB",
				"SU-EDU"
			],
			"event_scene": [
				"EV-WRK"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20261011-LET-003/front-public.jpg 通知落款：日期 1996-04-01。；front-public.jpg 落款广远人事教育处，1996年4月1日。；广州远洋运输公司名称及广州所在地与公开机构资料相符：https://sw.gz.gov.cn/ztzl/spjck/myfzxxpt/gjhydlqyba/content/post_2439143.html；中远历史材料将广州远洋运输公司简称为广远：https://static.cninfo.com.cn/finalpage/2004-06-17/14157245.html"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "LET_2007年",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2007-05-28",
			"date_end": "2007-05-28",
			"time_notes": "据front-public.jpg 表格填写日期补充书写或填写日期；不以入藏日期代替材料年代。",
			"country": "中国",
			"province": "广东省",
			"city": "广州市",
			"place_notes": "表格单位审核栏印有广州远洋运输公司，地点为办理机构关联城市，不记录私人地址。",
			"organizations": [
				"广州远洋运输公司"
			],
			"themes": [
				"SU-LAB"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "LJM-20261011-LET-004/front-public.jpg 表格填写日期：日期 2007-05-28。；front-public.jpg 的日期和单位审核栏；未转录任何身份号码、账号、电话或签名。"
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
			"record_status": "ACT",
			"item_id": "LJM-20261011-PHO-001",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"title": "那天，杯子都举起来了",
			"date_display": "1994",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG2",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-001/front-public.jpg",
				"/archive/LJM-20261011-PHO-001/back-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-01-public.png",
				"/archive/LJM-20261011-PHO-001/detail-01-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-02-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-03-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-04-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-05-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-06-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-07-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-02-public.png",
				"/archive/LJM-20261011-PHO-001/detail-08-public.jpg",
				"/archive/LJM-20261011-PHO-001/detail-03-public.png",
				"/archive/LJM-20261011-PHO-001/detail-04-public.png"
			],
			"collection_code": "PHO_1994_FAM_MEM_NONE_C0+OTH_G",
			"batch_id": "FSA-20260808-103",
			"physical_location": "佛山",
			"date_start": "1994-03-20",
			"date_end": "1994-03-20",
			"acquisition_method": "PR-PUR",
			"country": "中国",
			"province": "广东省",
			"themes": [
				"SU-FAM"
			],
			"condition_grade": "C0",
			"condition_details": [
				"DM-OTH"
			],
			"scan_date": "2026-09-09",
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"time_notes": "依据本组多张照片相机日期水印94 3 20，记录为1994-03-20；相机时钟是否校准未经独立验证。",
			"color": "CL-COL",
			"event_scene": [
				"EV-WED"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/front-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/back-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-01-public.png；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-01-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-02-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-03-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-04-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-05-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-06-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-07-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-02-public.png；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-08-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-03-public.png；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-001/detail-04-public.png；14张已发布图含婚宴、婚纱场景，多张清楚显示94 3 20日期水印。"
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
			"description": "胸花、合影、桌上的菜，还有没收住的笑。照片里的日子很热闹，翻到今天，声音却轻轻落了下来。",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-PHO-002",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"title": "忙里，借镜头停一下",
			"date_display": "1987",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-002/front-public.jpg"
			],
			"collection_code": "PHO_1987_OTH_WRK_NONE_C1+FAD_G",
			"batch_id": "FSA-20260808-104",
			"physical_location": "佛山",
			"country": "中国",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C1",
			"condition_details": [
				"DM-FAD"
			],
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"event_scene": [
				"EV-WRK"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-002/front-public.jpg；工作桌场景，右下有87年日期水印；现有1987年保留，不据模糊月日补精确日期。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-WRK"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				},
				"D08": {
					"shot_form": "FM-P1"
				}
			}
		},
		"public_view": {
			"description": "一张办公桌旁的旧影。纸张摆在面前，没说完的日常留在画面里。",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-PHO-003",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"title": "抱紧的这一秒",
			"date_display": "1989",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-003/front-public.png"
			],
			"collection_code": "PHO_1989_FAM_FAM_NONE_C2+FAD_G",
			"batch_id": "FSA-20260808-105",
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"physical_location": "佛山",
			"country": "中国",
			"province": "广东省",
			"themes": [
				"SU-FAM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-FAD"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-003/front-public.png；彩色室内餐桌合影，画面可见3人。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D03": {
					"people_count": 3
				}
			}
		},
		"public_view": {
			"description": "餐桌上的杯碟很多，最先看见的却是那双小胳膊。一个拥抱，把整张照片都变暖了。",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-PHO-004",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"title": "这张旧影有一点风",
			"date_display": "1989",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-004/front-public.jpg"
			],
			"collection_code": "PHO_1989_OTH_OTH_NONE_C2+FAD_G",
			"batch_id": "FSA-20260808-106",
			"physical_location": "佛山",
			"date_start": "1989-03-06",
			"source_place": "市场",
			"country": "中国",
			"province": "广东省",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-FAD"
			],
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-004/front-public.jpg；彩色室外单人肖像。"
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
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				}
			}
		},
		"public_view": {
			"description": "窗边的光落在画面里。人没有走动，看着却很像一个可以慢慢过的下午。",
			"transcription": "",
			"revision_note": "",
			"tags": []
		}
	},
	{
		"core": {
			"record_status": "ACT",
			"item_id": "LJM-20261011-PHO-005",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"title": "笑意还没褪色",
			"date_display": "1970",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
			"digitization_status": "DG0",
			"transcription_status": "TX0",
			"use_status": "U3",
			"publication_file_path": [
				"/archive/LJM-20261011-PHO-005/front-public.png"
			],
			"collection_code": "PHO_1970_FAM+WOM_ID_NONE_C2+OTH_G",
			"batch_id": "FSA-20260808-107",
			"physical_location": "佛山",
			"country": "中国",
			"province": "黑龙江省",
			"city": "哈尔滨市",
			"themes": [
				"SU-FAM",
				"SU-WOM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-OTH"
			],
			"created_date": "2026-10-11",
			"updated_date": "2026-10-14",
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-005/front-public.png；黑白单人肖像。"
		},
		"metadata": {
			"schema": "photo",
			"dimensions": {
				"D07": {
					"photo_function": "FN-ID"
				},
				"D12": {
					"verso_types": [
						"VS-NONE"
					]
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				}
			}
		},
		"public_view": {
			"description": "纸面有了岁月，眼里的笑还很近。看一眼，就想把这一页翻得轻一点。",
			"transcription": "",
			"revision_note": "",
			"tags": []
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-006/front-public.jpg；幼儿单人肖像，未见可读日期或地点。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-007/front-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-007/back-public.jpg；逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-007/detail-01-public.jpg；三张彩色户外合影，背景无可唯一定位的标识。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
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
			"date_display": "1990",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1990_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"date_start": "1990-01-25",
			"date_end": "1990-01-25",
			"time_notes": "依据发布照片可见相机日期水印记录为1990-01-25；相机时钟是否校准未经独立验证。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-008/front-public.jpg；室内人物与花卉，右下角相机日期水印可读1990年1月25日。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				},
				"D13": {
					"mark_types": [
						"MK-DATE"
					],
					"mark_transcription": "1990-01-25"
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
			"date_display": "2000",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "A",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_2000_OTH_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-OTH"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-009/front-public.jpg；沿水岸步道和行人，未见可唯一定位的标识。"
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
				},
				"D08": {
					"shot_form": "FM-STR"
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
			"title": "仰起头的这一秒",
			"accession_date": "2026-10-11",
			"object_type": "PHO",
			"date_display": "1995",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1995_MEM_FAM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"date_start": "1995-02-22",
			"date_end": "1995-02-22",
			"time_notes": "依据发布照片可见相机日期水印记录为1995-02-22；相机时钟是否校准未经独立验证。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-011/front-public.jpg；室内双人合影；画面日期水印1995年2月22日，经主线程单图复核。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
				},
				"D13": {
					"mark_types": [
						"MK-DATE"
					],
					"mark_transcription": "1995-02-22"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-012/front-public.jpg；单人坐在键盘乐器旁；右下印有中山照像、鶴崗字样。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				},
				"D09": {
					"photography_source": "PS-STU"
				},
				"D13": {
					"mark_types": [
						"MK-STU"
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
			"date_display": "1992",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1992_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"date_start": "1992-06-12",
			"date_end": "1992-06-12",
			"time_notes": "依据发布照片可见相机日期水印记录为1992-06-12；相机时钟是否校准未经独立验证。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-013/front-public.jpg；游客与猴群场景；右下相机水印1992年6月12日，经主线程单图复核。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D13": {
					"mark_types": [
						"MK-DATE"
					],
					"mark_transcription": "1992-06-12"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "上海大厦",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-014/front-public.jpg；照片下沿印字：上海·上海大厦。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "一座钢桥、一栋高楼，被同一张旧影连起来。路有来处，照片有余温。",
			"transcription": "",
			"tags": [],
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "大世界",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-015/front-public.jpg；照片下沿印字：上海·大世界。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "高塔、街口和路人，都装进一张不大的旧影。世界很大，留住它的纸很薄。",
			"transcription": "",
			"tags": [],
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "工人文化宫",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-016/front-public.jpg；照片下沿印字：上海·工人文化宫。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "工人文化宫立在街角，窗格、电线和行人仍然清楚。日子远了，街角没有。",
			"transcription": "",
			"tags": [],
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "国际饭店",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-017/front-public.jpg；照片下沿印字：上海·国际饭店。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "国际饭店立在街景中央。车辆很小，天空很高，一座城的气势还在。",
			"transcription": "",
			"tags": [],
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
			"date_display": "1960",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1960_CITY_MEM_NONE_C2+YEL_G",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "黄浦江畔",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-018/front-public.jpg；照片下沿印字：上海·黄浦江畔。"
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
				},
				"D08": {
					"shot_form": "FM-STR"
				}
			}
		},
		"public_view": {
			"description": "黄浦江畔的楼、车和船，沿着画面排开。黑白很静，江边应该很热闹。",
			"transcription": "",
			"tags": [],
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
			"date_display": "1960",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1960_CITY_MEM_NONE_C2+YEL_G",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "龙华塔",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-019/front-public.jpg；照片下沿印字：上海·龙华塔。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "龙华塔下有人缓缓走过。远处的时间，被这一张照片放低了声音。",
			"transcription": "",
			"tags": [],
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
			"date_display": "1960",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1960_CITY_MEM_NONE_C2+YEL_G",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "闵行一号路",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-020/front-public.jpg；照片下沿印字：上海·闵行一号路。"
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
				},
				"D08": {
					"shot_form": "FM-STR"
				}
			}
		},
		"public_view": {
			"description": "照片题名上海闵行一号路。车和人都在各自的方向里，时间却停在同一张纸上。",
			"transcription": "",
			"tags": [],
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
			"date_display": "1960",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1960_CITY_MEM_NONE_C2+YEL_G",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "少年宫",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-021/front-public.jpg；照片下沿印字：上海·少年宫。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "少年宫前的树被修得整齐，台阶向屋里延伸。旧影安静，想象却很热闹。",
			"transcription": "",
			"tags": [],
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "豫园九曲桥",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-022/front-public.jpg；照片下沿印字：上海·豫园九曲桥。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "九曲桥弯进亭阁与水面。照片里没有对白，倒很适合把话藏一会儿。",
			"transcription": "",
			"tags": [],
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
			"date_display": "1960",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1960_CITY_MEM_NONE_C2+YEL_G",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "上海市",
			"specific_place": "中百公司",
			"place_notes": "地点依据照片下沿印刷标题。此名称为照片所载历史地点称呼，不据此推定拍摄年份。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-023/front-public.jpg；照片下沿印字：上海·中百公司。"
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
				},
				"D08": {
					"shot_form": "FM-BLD"
				}
			}
		},
		"public_view": {
			"description": "中百公司的楼影、电车和行人，一起停在这张旧照片里。城市继续往前，它没有。",
			"transcription": "",
			"tags": [],
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-024/front-public.jpg；两人站在传统建筑栏杆前，建筑未能唯一识别。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-025/front-public.jpg；成人怀抱幼儿，背景题字不作为私人地点定位依据。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-026/front-public.jpg；室内单人生活照；下沿有未能完整辨清的日期水印，不填具体日期。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-027/front-public.jpg；多人围桌用餐。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"province": "黑龙江省",
			"city": "哈尔滨市",
			"place_notes": "相馆印记可读哈尔滨（主线程单图复核）；记录为相馆所在城市线索，不能单独证明人物居住地。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-028/front-public.jpg；单人肖像，下边缘有相馆印章；哈尔滨字样经主线程复核。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				},
				"D09": {
					"photography_source": "PS-STU"
				},
				"D13": {
					"mark_types": [
						"MK-STU"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-029/front-public.jpg；两人在庭院中合影，未见可唯一定位标识。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-030/front-public.jpg；舞台上两位表演者及台下观众，背景文字不足以可靠确定地点。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-031/front-public.jpg；画面主体为双人舞蹈，背景另有人物；不将主体人数当作全画面人数。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"event_scene": [
				"EV-WED"
			],
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-032/front-public.jpg；双人婚纱合影，未见日期或相馆名称。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-033/front-public.jpg；多人围桌举杯宴饮。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-034/front-public.jpg；室内单人肖像，未见可读日期或地点。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-035/front-public.jpg；园林棕榈与草坪，旗帜远小，不足以可靠确定国家或地点。"
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
				},
				"D08": {
					"shot_form": "FM-OTH"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-036/front-public.jpg；室内双人合影。"
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
				},
				"D08": {
					"shot_form": "FM-P2"
				},
				"D03": {
					"people_count": 2
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
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1989_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"date_start": "1989-01-14",
			"date_end": "1989-01-14",
			"time_notes": "依据发布照片可见相机日期水印记录为1989-01-14；相机时钟是否校准未经独立验证。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-037/front-public.jpg；自动扶梯上的多人合影；右下水印1989年1月14日，经主线程单图复核。"
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
				},
				"D08": {
					"shot_form": "FM-GRP"
				},
				"D13": {
					"mark_types": [
						"MK-DATE"
					],
					"mark_transcription": "1989-01-14"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
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
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-BW",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-038/front-public.jpg；戴帽单人室内肖像，未见可读日期或地点。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
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
			"date_display": "1994",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PHO_1994_MEM_MEM_NONE_C2+YEL_G",
			"country": "中国",
			"themes": [
				"SU-MEM"
			],
			"condition_grade": "C2",
			"condition_details": [
				"DM-YEL"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"color": "CL-COL",
			"date_start": "1994-04-04",
			"date_end": "1994-04-04",
			"time_notes": "依据发布照片可见相机日期水印记录为1994-04-04；相机时钟是否校准未经独立验证。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "逐图检查当前官网发布副本：https://laojiumopian.com/archive/LJM-20261011-PHO-039/front-public.jpg；海中单人；右下相机水印1994年4月4日，经主线程单图复核。"
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
				},
				"D08": {
					"shot_form": "FM-P1"
				},
				"D03": {
					"people_count": 1
				},
				"D13": {
					"mark_types": [
						"MK-DATE"
					],
					"mark_transcription": "1994-04-04"
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
			"title": "来玩，好吗",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989-12-26",
			"date_end": "1989-12-26",
			"time_notes": "据发布图片手写落款识读为1989-12-26；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "落款写厦门，正文邀请来厦门，记录寄写城市；收件地广州另存于专属字段。",
			"province": "福建省",
			"city": "厦门市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1989-12-26。；落款写厦门，正文邀请来厦门，记录寄写城市；收件地广州另存于专属字段。；寄收城市取自本件文字，仅保留城市层级。；图片印刷发行信息：鹭江出版社，厦门。出版地不作寄出地。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1989-12-26"
				},
				"PC07": {
					"dispatch_place": [
						"厦门市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
				},
				"PC13": {
					"publisher": [
						"鹭江出版社"
					],
					"publisher_place": [
						"厦门"
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
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_UNK_COM_MEM+SCH_UNK_UNK",
			"event_scene": [
				"EV-SCH"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_display": "1989",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：福建美术出版社，福州。出版地不作寄出地。；落款年份疑似88，与既有1989冲突。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"福建美术出版社"
					],
					"publisher_place": [
						"福州"
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
			"date_display": "2013",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_2013_UNK_UNK_CHD+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-CHD"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2013-07-20",
			"date_end": "2013-07-20",
			"time_notes": "据发布图片邮戳识读为2013-07-20；这是寄递时间，不等同发行时间。图版亦印2013年广州第十届中小学生书信节。",
			"country": "中国",
			"place_notes": "图版活动名称和广州邮戳直接对应广州；不转录未成年人姓名或班级。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 2013-07-20。图版亦印2013年广州第十届中小学生书信节。；图版活动名称和广州邮戳直接对应广州；不转录未成年人姓名或班级。；印刷活动年份2013及广州寄递邮戳。"
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
					"dispatch_place": [
						"广州市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC05": {
					"dispatch_date": "2013-07-20"
				},
				"PC03": {
					"issue_date": "2013"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"place_notes": "寄件栏明确广西恭城，仅保留行政区层级，不转录私人地址。",
			"province": "广西壮族自治区",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：华艺出版社。出版地不作寄出地。；寄件栏明确广西恭城，仅保留行政区层级，不转录私人地址。；本件寄收栏文字。"
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
					"dispatch_place": [
						"广西恭城"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"华艺出版社"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_GRT_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989",
			"date_end": "1989",
			"time_notes": "据发布图片邮戳识读为1989；这是寄递时间，不等同发行时间。只确认邮戳年份，月日不作确定转录。",
			"country": "中国",
			"place_notes": "广州寄发邮戳可辨，记录邮寄城市。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 1989。只确认邮戳年份，月日不作确定转录。；广州寄发邮戳可辨，记录邮寄城市。；图片印刷发行信息：鹭江出版社，厦门。出版地不作寄出地。；正文中英文圣诞新年祝语。"
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
				},
				"PC20": {
					"language": [
						"中文",
						"英文"
					]
				},
				"PC05": {
					"dispatch_date": "1989"
				},
				"PC13": {
					"publisher": [
						"鹭江出版社"
					],
					"publisher_place": [
						"厦门"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"place_notes": "本件有广州邮戳且收件栏为广州，作为寄递关联城市，不把印刷地福州当成书写地。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：福建画报社，福州。出版地不作寄出地。；本件有广州邮戳且收件栏为广州，作为寄递关联城市，不把印刷地福州当成书写地。；双邮戳年份磨损，不能可靠补齐具体年。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"福建画报社"
					],
					"publisher_place": [
						"福州"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"place_notes": "寄件栏可辨黑龙江省，只记到省级，不转录乡村及私人门牌。",
			"province": "黑龙江省",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；寄件栏可辨黑龙江省，只记到省级，不转录乡村及私人门牌。；本件寄收栏。"
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
					"dispatch_place": [
						"黑龙江省"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_VIEW_UNK_OTH+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"place_notes": "背面图注明确为漓江及漓江鸬鹚，记录图像地点，寄收地另存。",
			"province": "广西壮族自治区",
			"city": "桂林市",
			"specific_place": "漓江",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；背面图注明确为漓江及漓江鸬鹚，记录图像地点，寄收地另存。；背面中英文图注“漓江 Li River”；不将师院班级数字当作年代。；图片印刷发行信息：印刷工业出版社。出版地不作寄出地。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC06": {
					"image_place_text": [
						"漓江"
					]
				},
				"PC08": {
					"destination_place": "广州市"
				},
				"PC13": {
					"publisher": [
						"印刷工业出版社"
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
			"date_display": "约1993年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_约1993年_OTH_UNK_TRN+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-TRN"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992",
			"date_end": "1993",
			"time_notes": "手写祝语含九三，结合新年语境暂记约1993年；可能写于1992年末，邮戳年份不清。",
			"country": "中国",
			"place_notes": "寄件栏明确桂林，记录寄件关联城市，不由摩托车品牌推断地点。",
			"province": "广西壮族自治区",
			"city": "桂林市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；背面手写九三与印刷新年祝语；图注为铃木VS1400GLJ（日本）。；图片印刷发行信息：岭南美术出版社。出版地不作寄出地。；寄件栏明确桂林，记录寄件关联城市，不由摩托车品牌推断地点。"
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
					"image_subject": "铃木 VS1400GLJ 摩托车"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"岭南美术出版社"
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
			"date_display": "2014",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_2014_ART_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2014-09-18",
			"date_end": "2014-09-18",
			"time_notes": "据发布图片手写落款识读为2014-09-18；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "图版写From Xiamen to the World，正文落款地点为鼓浪屿，记录寄写城市。",
			"province": "福建省",
			"city": "厦门市",
			"specific_place": "鼓浪屿",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 2014-09-18。；图版写From Xiamen to the World，正文落款地点为鼓浪屿，记录寄写城市。；背面落款14.9.18及厦门印刷地名。"
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
					"writing_date_text": "年代未知",
					"writing_date": "2014-09-18"
				},
				"PC07": {
					"dispatch_place": [
						"厦门市鼓浪屿"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"date_display": "1998",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1998_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1998-08-03",
			"date_end": "1998-08-03",
			"time_notes": "据发布图片手写落款识读为1998-08-03；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "寄件栏明确江西省丰城市，只记省级及专属寄出地，不抄录村庄门牌。",
			"province": "江西省",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1998-08-03。；寄件栏明确江西省丰城市，只记省级及专属寄出地，不抄录村庄门牌。；手写落款98年8月3日及寄件城市。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1998-08-03"
				},
				"PC07": {
					"dispatch_place": [
						"江西省丰城市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"date_display": "约1989—1990年",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_约1989-1990年_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989",
			"date_end": "1990",
			"time_notes": "落款写90年元旦前夕，据节日前夕语境给出1989—1990年范围，不虚构具体日。",
			"country": "中国",
			"place_notes": "寄递邮戳可辨广州；不把湖北省收件地址当作书写地。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；手写落款90年元旦前夕。；寄递邮戳可辨广州；不把湖北省收件地址当作书写地。"
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
				},
				"PC20": {
					"language": [
						"中文"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：鹭江出版社，厦门。出版地不作寄出地。；落款只有12.20晚，正文含Merry Christmas。"
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
					"writing_date_text": "12.20晚"
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
				},
				"PC20": {
					"language": [
						"中文",
						"英文"
					]
				},
				"PC13": {
					"publisher": [
						"鹭江出版社"
					],
					"publisher_place": [
						"厦门"
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
			"date_display": "1979",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1979_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1979-10-04",
			"date_end": "1979-10-04",
			"time_notes": "据发布图片手写落款识读为1979-10-04；这是书写时间，不等同发行时间。放大后落款明确1979.10.4，修正既有1997误读。",
			"country": "日本",
			"place_notes": "信末写东京にて，直接记为书写城市；信中哈尔滨为回顾访问地点。",
			"province": "东京都",
			"city": "东京",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1979-10-04。放大后落款明确1979.10.4，修正既有1997误读。；信末写东京にて，直接记为书写城市；信中哈尔滨为回顾访问地点。；日文正文及中文称谓、信封；不转录个人姓名。"
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
					"writing_date_text": "1997年10月4日",
					"writing_date": "1979-10-04"
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
				},
				"PC20": {
					"language": [
						"日文",
						"中文"
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
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989-12-15",
			"date_end": "1989-12-15",
			"time_notes": "据发布图片手写落款识读为1989-12-15；这是书写时间，不等同发行时间。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1989-12-15。；图片印刷发行信息：鹭江出版社，厦门。出版地不作寄出地。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1989-12-15"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"鹭江出版社"
					],
					"publisher_place": [
						"厦门"
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
			"title": "把树写进信里",
			"accession_date": "2026-10-11",
			"object_type": "PST",
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989-07-10",
			"date_end": "1989-07-10",
			"time_notes": "据发布图片手写落款识读为1989-07-10；这是书写时间，不等同发行时间。原文连写890710，按年月日读为1989年7月10日。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1989-07-10。原文连写890710，按年月日读为1989年7月10日。；图片印刷发行信息：福建美术出版社，福州。出版地不作寄出地。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1989-07-10"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"福建美术出版社"
					],
					"publisher_place": [
						"福州"
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
			"date_display": "1988",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1988_VIEW_GRT_OTH+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-OTH"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1988-12-18",
			"date_end": "1988-12-18",
			"time_notes": "据发布图片手写落款识读为1988-12-18；这是书写时间，不等同发行时间。",
			"country": "美国",
			"place_notes": "背面图注明确美国威基基海滩，正面海滩及钻石头山相符；这是图像地点，寄写地广州另存。",
			"province": "夏威夷州",
			"city": "檀香山市",
			"specific_place": "威基基海滩",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1988-12-18。；背面图注明确美国威基基海滩，正面海滩及钻石头山相符；这是图像地点，寄写地广州另存。；图注、画面与广州邮戳；夏威夷官方旅游资料交叉定位：https://www.gohawaii.com/islands/oahu/travel-info/inspiring-oahu-itineraries"
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
					"writing_date_text": "年代未知",
					"writing_date": "1988-12-18"
				},
				"PC07": {
					"dispatch_place": [
						"广州市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC06": {
					"image_place_text": [
						"美国威基基海滩"
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
			"date_display": "1988",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1988_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1988-12-18",
			"date_end": "1988-12-18",
			"time_notes": "据发布图片手写落款识读为1988-12-18；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "上海邮戳与寄件栏上海交大互证，仅记城市。",
			"province": "上海市",
			"city": "上海市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1988-12-18。；上海邮戳与寄件栏上海交大互证，仅记城市。；邮戳、落款88.12.18与寄件机构地名。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1988-12-18"
				},
				"PC07": {
					"dispatch_place": [
						"上海市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_ART_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：锦州市邮电局报刊零售公司，锦州市。出版地不作寄出地。；正面室内静物，背面英文圣诞祝语及出版信息。"
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
					"image_subject": "室内花束与陈设"
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
				},
				"PC20": {
					"language": [
						"英文",
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"锦州市邮电局报刊零售公司"
					],
					"publisher_place": [
						"锦州市"
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
			"date_display": "1992",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1992_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-04-05",
			"date_end": "1992-04-05",
			"time_notes": "据发布图片手写落款识读为1992-04-05；这是书写时间，不等同发行时间。落款原文为九二・四・五。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1992-04-05。落款原文为九二・四・五。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1992-04-05"
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
				},
				"PC20": {
					"language": [
						"中文"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：太原市邮政局。出版地不作寄出地。；收件机构华南农大，仅补充城市层级。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"太原市邮政局"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"date_display": "1992",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1992_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-12-20",
			"date_end": "1992-12-20",
			"time_notes": "据发布图片邮戳识读为1992-12-20；这是寄递时间，不等同发行时间。旋转邮戳可辨92.12.20.16；手写年份连笔不清，不将寄递日期冒充书写日期。",
			"country": "中国",
			"place_notes": "长沙邮戳与寄件机构所在地文字互证，记录寄出城市。",
			"province": "湖南省",
			"city": "长沙市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 1992-12-20。旋转邮戳可辨92.12.20.16；手写年份连笔不清，不将寄递日期冒充书写日期。；长沙邮戳与寄件机构所在地文字互证，记录寄出城市。；邮戳92.12.20.16及长沙地名。"
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
					"dispatch_place": [
						"长沙市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC05": {
					"dispatch_date": "1992-12-20"
				},
				"PC08": {
					"destination_place": "广州市"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_ART_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"country": "中国",
			"place_notes": "寄件栏写桂医并有桂林邮戳，按城市层级记录寄出地。",
			"province": "广西壮族自治区",
			"city": "桂林市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：中国图片社。出版地不作寄出地。；寄件栏写桂医并有桂林邮戳，按城市层级记录寄出地。；图注姚黄，正文中英文祝语。"
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
					"image_subject": "瓶插黄色牡丹，图注姚黄"
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
				},
				"PC20": {
					"language": [
						"中文",
						"英文"
					]
				},
				"PC13": {
					"publisher": [
						"中国图片社"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
			"date_display": "1992",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1992_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1992-12-20",
			"date_end": "1992-12-20",
			"time_notes": "据发布图片邮戳识读为1992-12-20；这是寄递时间，不等同发行时间。旋转邮戳可辨92.12.20.17。",
			"country": "中国",
			"place_notes": "正文自述在宜昌，邮戳也显示宜昌，记录寄写城市。",
			"province": "湖北省",
			"city": "宜昌市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 1992-12-20。旋转邮戳可辨92.12.20.17。；正文自述在宜昌，邮戳也显示宜昌，记录寄写城市。；图片印刷发行信息：湖南画报社；湖南美术出版社。出版地不作寄出地。；正文与邮戳地名。"
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
					"dispatch_place": [
						"宜昌市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC05": {
					"dispatch_date": "1992-12-20"
				},
				"PC13": {
					"publisher": [
						"湖南画报社",
						"湖南美术出版社"
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
			"date_display": "2003",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_2003_UNK_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2003-10-15",
			"date_end": "2003-10-15",
			"time_notes": "据发布图片邮戳识读为2003-10-15；这是寄递时间，不等同发行时间。广州邮戳03.10.15，附注10.15日飞船上天，与神舟五号发射日期互证。",
			"country": "中国",
			"place_notes": "广州邮戳直接识别寄发城市，收件上海另存。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 2003-10-15。广州邮戳03.10.15，附注10.15日飞船上天，与神舟五号发射日期互证。；广州邮戳直接识别寄发城市，收件上海另存。；中国载人航天官方史料核实世纪和日期：https://www.cmse.gov.cn/art/2009/9/25/art_1357_22316.html"
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
					"dispatch_place": [
						"广州市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC05": {
					"dispatch_date": "2003-10-15"
				},
				"PC08": {
					"destination_place": "上海市"
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
			"date_display": "1994",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1994_UNK_COM_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1994-02-23",
			"date_end": "1994-02-23",
			"time_notes": "据发布图片手写落款识读为1994-02-23；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "正文与落款可见江苏及江南小镇，只记省级，不从邮编推断具体村镇。",
			"province": "江苏省",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1994-02-23。；正文与落款可见江苏及江南小镇，只记省级，不从邮编推断具体村镇。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1994-02-23"
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
				},
				"PC20": {
					"language": [
						"中文"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：江苏邮电报社。出版地不作寄出地。；仅有寄语与出版者，无清晰落款年。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"江苏邮电报社"
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
			"date_display": "1989",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1989_UNK_UNK_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1989-12-26",
			"date_end": "1989-12-26",
			"time_notes": "据发布图片手写落款识读为1989-12-26；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "寄件栏写桂林林科所，邮戳地名相符，记录城市，不扩写私人地址。",
			"province": "广西壮族自治区",
			"city": "桂林市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1989-12-26。；寄件栏写桂林林科所，邮戳地名相符，记录城市，不扩写私人地址。；落款89.12.26及桂林寄件地。；图片印刷发行信息：上海人民美术出版社。出版地不作寄出地。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1989-12-26"
				},
				"PC07": {
					"dispatch_place": [
						"桂林市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "广州市"
				},
				"PC13": {
					"publisher": [
						"上海人民美术出版社"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_UNK_COM_MEM+SCH_UNK_UNK",
			"event_scene": [
				"EV-SCH"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；中文及英文圣诞新年祝语；没有可确认年份或城市。"
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
				},
				"PC20": {
					"language": [
						"中文",
						"英文"
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
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_年代未知_GRT_GRT_MEM+UNK_UNK_UNK",
			"event_scene": [
				"EV-UNK"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片印刷发行信息：Sun greeting cards／太阳贺卡。出版地不作寄出地。；图中为友谊祝语，无明确落款年月或地点。"
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC13": {
					"publisher": [
						"Sun greeting cards／太阳贺卡"
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
			"date_display": "1990",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_1990_GRT_COM_MEM+FST_UNK_UNK",
			"event_scene": [
				"EV-FST"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "1990-12-22",
			"date_end": "1990-12-22",
			"time_notes": "据发布图片手写落款识读为1990-12-22；这是书写时间，不等同发行时间。",
			"country": "中国",
			"place_notes": "广州邮戳直接明确寄出城市，武汉收件地另存。",
			"province": "广东省",
			"city": "广州市",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：落款日期 1990-12-22。；广州邮戳直接明确寄出城市，武汉收件地另存。；落款90.12.22，广州邮戳90.12.28，分开记录书写和寄递日期。；广州邮戳90.12.28。"
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
					"writing_date_text": "年代未知",
					"writing_date": "1990-12-22"
				},
				"PC07": {
					"dispatch_place": [
						"广州市"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC08": {
					"destination_place": "武汉市"
				},
				"PC05": {
					"dispatch_date": "1990-12-28"
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
			"date_display": "2012",
			"record_status": "ACT",
			"privacy_level": "G",
			"rights_status": "UNK",
			"research_status": "R1",
			"evidence_level": "C",
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
			"updated_date": "2026-10-14",
			"collection_code": "PST_2012_UNK_TRV_MEM+TRV_UNK_UNK",
			"event_scene": [
				"EV-TRV"
			],
			"themes": [
				"SU-MEM"
			],
			"id_check": "永久编号格式与重复检查通过，编号、JSON、图片目录和发布路径一致。",
			"required_check": "核心必填字段、对象类型与 schema、隐私检查、图片路径和正式构建均已通过。",
			"date_start": "2012",
			"date_end": "2012",
			"time_notes": "据发布图片邮戳识读为2012；这是寄递时间，不等同发行时间。邮戳年份2012清楚，月日暂不作确定转录。",
			"country": "中国",
			"place_notes": "厦门邮戳与鼓浪屿旅游纪念章互证，记录寄写城市及公共景区。",
			"province": "福建省",
			"city": "厦门市",
			"specific_place": "鼓浪屿",
			"last_research_date": "2026-10-13",
			"evidence_basis": "2026-10-13复核：根据现有公开图片的正文语言补录；不转录姓名、签名和完整地址。；图片直接证据：邮戳日期 2012。邮戳年份2012清楚，月日暂不作确定转录。；厦门邮戳与鼓浪屿旅游纪念章互证，记录寄写城市及公共景区。；图片印刷发行信息：皇后社工作室。出版地不作寄出地。；厦门邮戳与鼓浪屿纪念章。"
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
					"dispatch_place": [
						"厦门市鼓浪屿"
					]
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
				},
				"PC20": {
					"language": [
						"中文"
					]
				},
				"PC05": {
					"dispatch_date": "2012"
				},
				"PC13": {
					"publisher": [
						"皇后社工作室"
					]
				},
				"PC08": {
					"destination_place": "广州市"
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
	}
] satisfies ArchiveItem[];

export type { ArchiveItem } from './archive-schema';
