import createCrudService from './crudServiceFactory';

// "Collections" — recorded waste pickups (WasteCollection on the backend).
const collectionService = createCrudService('/collections');

export default collectionService;
