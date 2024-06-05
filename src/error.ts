import { Settings } from "./settings";
import { CustomKey } from "./type";

export class KeySettingsError extends Error {
	constructor(message: string, params: { settings: Settings, toPrevHotkeys: CustomKey[], toNextHotkeys: CustomKey[] }) {
		super(message);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, KeySettingsError);
		}

		this.name = 'KeySettingsError';
		console.warn(params);
	}
}
