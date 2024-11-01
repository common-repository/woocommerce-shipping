import {
	CUSTOM_BOX_ID_PREFIX,
	PACKAGE_TYPES,
} from '../components/label-purchase/packages';

export interface CustomPackage {
	name: string;
	length: '';
	width: '';
	height: '';
	boxWeight: 0;
	id: CUSTOM_BOX_ID_PREFIX;
	type: PACKAGE_TYPES;
	dimensions: `${ string } x ${ string } x ${ string }`; // L x W x H
	// Legacy extension saves inner dimensions.
	innerDimensions?: `${ string } x ${ string } x ${ string }`; // L x W x H
	isUserDefined: true;
}
