import { View, WorkspaceItem, WorkspaceLeaf } from 'obsidian';

type Property = {
	key: string,
	type: string,
	value: string | string[],
};

export type CustomView = View & {
	metadataEditor?: {
		properties?: Property[],
	},
};

export type CustomWsItem = WorkspaceItem & {
	id: string,
	type: string,
};

export type CustomWsLeaf = WorkspaceLeaf & {
	id?: string,
	name?: string,
	aliases?: string[],
	path?: string,
	deleted?: boolean,
};
