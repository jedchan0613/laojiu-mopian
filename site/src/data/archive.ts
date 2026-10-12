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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
			"updated_date": "2026-10-12",
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
	}
] satisfies ArchiveItem[];

export type { ArchiveItem } from './archive-schema';
