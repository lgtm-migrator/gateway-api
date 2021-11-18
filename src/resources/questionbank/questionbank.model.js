import { model, Schema } from 'mongoose';

import QuestionbankClass from './questionbank.entity';

const questionbankSchema = new Schema(
	{
		// New object properties here
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Load entity class
questionbankSchema.loadClass(QuestionbankClass);

export const Questionbank = model('Questionbank', questionbankSchema);