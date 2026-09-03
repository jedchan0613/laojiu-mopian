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
			"updated_date": "2026-09-01",
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
			"updated_date": "2026-08-28",
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
			"updated_date": "2026-09-01",
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
			"updated_date": "2026-08-29",
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
	}
] satisfies ArchiveItem[];

export type { ArchiveItem } from './archive-schema';
