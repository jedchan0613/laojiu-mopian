import cardSource from './standards/card-dimensions.json';
import credentialSource from './standards/credential-dimensions.json';
import diaryNotebookSource from './standards/diary-notebook-dimensions.json';
import photoSource from './standards/photo-dimensions.json';
import postcardSource from './standards/postcard-dimensions.json';
import type { ArchiveItem } from './archive-schema';

export interface DimensionDefinition {
	dimension_code: string;
	name: string;
	fields: string[];
	code_structure: string;
	rule: string;
	example: string;
	multi_value_rule: string;
	uncertainty_rule: string;
	register_mapping: string;
	notes: string;
}

export const photoDimensions = photoSource.dimensions as DimensionDefinition[];
export const postcardDimensions = postcardSource.dimensions as DimensionDefinition[];
export const diaryNotebookDimensions = diaryNotebookSource.dimensions as DimensionDefinition[];
export const credentialDimensions = credentialSource.dimensions as DimensionDefinition[];
export const cardDimensions = cardSource.dimensions as DimensionDefinition[];

export const allDimensionDefinitions = [
	...photoDimensions,
	...postcardDimensions,
	...diaryNotebookDimensions,
	...credentialDimensions,
	...cardDimensions,
];

export const getDimensionsForItem = (item: ArchiveItem) => {
	switch (item.metadata.schema) {
		case 'photo':
			return photoDimensions;
		case 'postcard':
			return postcardDimensions;
		case 'diary_notebook':
			return diaryNotebookDimensions;
		case 'credential':
			return credentialDimensions;
		case 'card':
			return cardDimensions;
		default:
			return [];
	}
};
