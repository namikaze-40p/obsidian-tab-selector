import { GoToPreviousNextTabSettings } from "./settings";
import { CustomKey } from "./type";

export class KeySettingsError extends Error {
	constructor(message: string, params: { settings: GoToPreviousNextTabSettings, toPrevHotkeys: CustomKey[], toNextHotkeys: CustomKey[] }) {
		super(message);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, KeySettingsError);
		}

		this.name = 'KeySettingsError';
		console.warn(params);
	}
}
