import { __ } from '@wordpress/i18n';

export const contentTypes = [
	{
		label: __( 'Merchandise', 'woocommerce-shipping' ),
		value: 'merchandise',
	},
	{
		label: __( 'Gift', 'woocommerce-shipping' ),
		value: 'gift',
	},
	{
		label: __( 'Returned Goods', 'woocommerce-shipping' ),
		value: 'returned_goods',
	},
	{
		label: __( 'Sample', 'woocommerce-shipping' ),
		value: 'sample',
	},
	{
		label: __( 'Documents', 'woocommerce-shipping' ),
		value: 'documents',
	},
	{
		label: __( 'Other', 'woocommerce-shipping' ),
		value: 'other',
	},
];

export const restrictionTypes = [
	{
		label: __( 'None', 'woocommerce-shipping' ),
		value: 'none',
	},
	{
		label: __( 'Quarantine', 'woocommerce-shipping' ),
		value: 'quarantine',
	},
	{
		label: __(
			'Sanitary/Phytosanitary Inspection',
			'woocommerce-shipping'
		),
		value: 'sanitary_phytosanitary_inspection',
	},
	{
		label: __( 'Other…', 'woocommerce-shipping' ),
		value: 'other',
	},
];

export const itnMatchingRegex =
	/^(?:(?:AES X\d{14})|(?:NOEEI 30\.\d{1,2}(?:\([a-z]\)(?:\(\d\))?)?))$/;
