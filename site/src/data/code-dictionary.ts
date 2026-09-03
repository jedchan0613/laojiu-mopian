import source from './standards/code-dictionary.json';

export interface CodeDictionaryEntry {
	dictionary_key: string;
	dimension_category: string;
	code: string;
	label: string;
	definition: string;
	field: string;
	input_mode: string;
	enabled: boolean;
	sort: number;
}

export const codeDictionary = source.entries as CodeDictionaryEntry[];
export const enabledCodeDictionary = codeDictionary.filter((entry) => entry.enabled);

const entriesByCode = new Map(enabledCodeDictionary.map((entry) => [entry.code, entry]));

export const getCodeEntry = (code: string) => entriesByCode.get(code);
export const getCodeLabel = (code: string) => getCodeEntry(code)?.label ?? code;

export const getDictionaryEntries = (dictionaryKey: string) =>
	enabledCodeDictionary
		.filter((entry) => entry.dictionary_key === dictionaryKey)
		.sort((a, b) => a.sort - b.sort);

