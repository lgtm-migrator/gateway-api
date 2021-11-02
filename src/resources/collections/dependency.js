import CollectionsService from './collections.service';
import CollectionsRepository from './collections.repository';

const collectionsRepository = new CollectionsRepository();

export const collectionsService = new CollectionsService(collectionsRepository);
