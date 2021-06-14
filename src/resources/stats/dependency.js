import StatsRepository from './stats.repository';
import StatsService from './stats.service';

export const statsRepository = new StatsRepository();
export const statsService = new StatsService(statsRepository);
