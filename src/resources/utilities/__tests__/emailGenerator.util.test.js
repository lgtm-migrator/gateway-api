import emailGenerator from '../emailGenerator.util';

describe('Email generator utility functions', () => {
	describe('_generateMetadataOnboardingRejected', () => {
		let isFederated;

		it('SHOULD include federated warning if isFederated is true', async () => {
			isFederated = true;

			const emailBody = emailGenerator.generateMetadataOnboardingRejected({ isFederated });

			// Federated warning should be present if dataset is from a federated publisher
			expect(emailBody.includes('Do not apply these changes directly to the Gateway')).toBe(true);
		});

		it('SHOULD NOT include federated warning if isFederated is false', async () => {
			isFederated = false;

			const emailBody = emailGenerator.generateMetadataOnboardingRejected({ isFederated });

			// Federated warning should not be present if dataset is not from a federated publisher
			expect(emailBody.includes('Do not apply these changes directly to the Gateway')).toBe(false);
		});
	});
	describe('_getRecipients', () => {
		const mockRecipients = [
			{ email: 'test1@test.com' },
			{ email: 'test2@test.com' },
			{ email: 'test3@test.com' },
			{ email: 'test1@test.com' },
		];
		it('Should remove duplicaties for production', async () => {
			const recipients = emailGenerator.getRecipients(mockRecipients, 'production', 'genericemail@test.com');
			expect(recipients.length).toBe(3);
			expect(recipients).toEqual([{ email: 'test1@test.com' }, { email: 'test2@test.com' }, { email: 'test3@test.com' }]);
		});

		it('Should replace recipients non production environtment to generic email', async () => {
			const recipients = emailGenerator.getRecipients(mockRecipients, undefined, 'genericemail@test.com');
			expect(recipients.length).toBe(1);
			expect(recipients).toEqual([{ email: 'genericemail@test.com' }]);
		});
	});
});
