import PaperClass from '../paper.entity';

describe('PaperEntity', function () {
	describe('constructor', function () {
		it('should create an instance of a paper entity with the expected properties', async function () {
			const paper = new PaperClass(
				32300742,
				'Violence-related knife injuries in a UK city; epidemiology and impact on secondary care resources.',
				'\n\n**Lay Summary**\n\nBackground:The incidence of knife-related injuries is rising across the UK. This study aimed to determine the spectrum of knife-related injuries in a major UK city, with regards to patient and injury characteristics. A secondary aim was to quantify their impact on secondary care resources. Methods:Observational study of patients aged 16+ years admitted to a major trauma centre following knife-related injuries resulting from interpersonal violence (May 2015 to April 2018). Patients were identified using Emergency Department and discharge coding, blood bank and UK national Trauma Audit and Research prospective registries. Patient and injury characteristics, outcome and resource utilisation were collected from ambulance and hospital records. Findings:532 patients were identified; 93% male, median age 26 years (IQR 20-35). Median injury severity score was 9 (IQR 3-13). 346 (65%) underwent surgery; 133 (25%) required intensive care; 95 (17·9%) received blood transfusion. Median length of stay was 3·3 days (IQR 1·7-6·0). In-hospital mortality was 10/532 (1·9%). 98 patients (18·5%) had previous attendance with violence-related injuries. 24/37 females (64·9%) were injured in a domestic setting. Intoxication with alcohol (19·2%) and illicit drugs (17·6%) was common. Causative weapon was household knife in 9%, knife (other/unspecified) in 38·0%, machete in 13·9%, small folding blade (2·8%) and, unrecorded in 36·3%. Interpretation:Knife injuries constitute 12·9% of trauma team workload. Violence recidivism and intoxication are common, and females are predominantly injured in a domestic setting, presenting opportunities for targeted violence reduction interventions. 13·9% of injuries involved machetes, with implications for law enforcement strategies.\n\n\n\n**Authors:**\n\nMalik NS, Munoz B, de Courcey C, Imran R, Lee KC, Chernbumroong S, Bishop J, Lord JM, Gkoutos G, Bowley DM, Foster MA.\n\n',
				null,
				'https://doi.org/10.1016/j.eclinm.2020.100296',
				'paper',
				{},
				null,
				[100000],
				{
					features: ['HDRUK Papers', 'Open Access'],
					topics: [],
				},
				'active',
				8,
				null,
				[],
				null,
				'EClinicalMedicine',
				2020,
				false
			);

			expect(paper.id).toEqual(32300742);
			expect(paper.type).toEqual('paper');
			expect(paper.name).toEqual('Violence-related knife injuries in a UK city; epidemiology and impact on secondary care resources.');
			expect(paper.description).toEqual(
				'\n\n**Lay Summary**\n\nBackground:The incidence of knife-related injuries is rising across the UK. This study aimed to determine the spectrum of knife-related injuries in a major UK city, with regards to patient and injury characteristics. A secondary aim was to quantify their impact on secondary care resources. Methods:Observational study of patients aged 16+ years admitted to a major trauma centre following knife-related injuries resulting from interpersonal violence (May 2015 to April 2018). Patients were identified using Emergency Department and discharge coding, blood bank and UK national Trauma Audit and Research prospective registries. Patient and injury characteristics, outcome and resource utilisation were collected from ambulance and hospital records. Findings:532 patients were identified; 93% male, median age 26 years (IQR 20-35). Median injury severity score was 9 (IQR 3-13). 346 (65%) underwent surgery; 133 (25%) required intensive care; 95 (17·9%) received blood transfusion. Median length of stay was 3·3 days (IQR 1·7-6·0). In-hospital mortality was 10/532 (1·9%). 98 patients (18·5%) had previous attendance with violence-related injuries. 24/37 females (64·9%) were injured in a domestic setting. Intoxication with alcohol (19·2%) and illicit drugs (17·6%) was common. Causative weapon was household knife in 9%, knife (other/unspecified) in 38·0%, machete in 13·9%, small folding blade (2·8%) and, unrecorded in 36·3%. Interpretation:Knife injuries constitute 12·9% of trauma team workload. Violence recidivism and intoxication are common, and females are predominantly injured in a domestic setting, presenting opportunities for targeted violence reduction interventions. 13·9% of injuries involved machetes, with implications for law enforcement strategies.\n\n\n\n**Authors:**\n\nMalik NS, Munoz B, de Courcey C, Imran R, Lee KC, Chernbumroong S, Bishop J, Lord JM, Gkoutos G, Bowley DM, Foster MA.\n\n'
			);
			expect(paper.resultsInsights).toEqual(null);
			expect(paper.categories).toEqual({});
			expect(paper.tags).toEqual({
				features: ['HDRUK Papers', 'Open Access'],
				topics: [],
			});
			expect(paper.license).toEqual(null);
			expect(paper.authors).toEqual([100000]);
			expect(paper.activeflag).toEqual('active');
			expect(paper.counter).toEqual(8);
			expect(paper.discourseTopicId).toEqual(null);
			expect(paper.relatedObjects).toEqual([]);
			expect(paper.uploader).toEqual(null);
			expect(paper.journal).toEqual('EClinicalMedicine');
			expect(paper.journalYear).toEqual(2020);
			expect(paper.isPreprint).toEqual(false);
		});
	});
});
