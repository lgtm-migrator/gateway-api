import { model, Schema } from 'mongoose';

const HelpSchema = new Schema({
	question: String,
	answer: String,
	category: String,
	activeFlag: Boolean,
});

export const Help = model('help_faq', HelpSchema);
