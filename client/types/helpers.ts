export type RecordValues< T extends Record< string, unknown > > = T[ keyof T ];

type SnakeToCamelCase< S extends string | number | symbol > =
	S extends `${ infer T }_${ infer U }`
		? `${ T }${ Capitalize< SnakeToCamelCase< U > > }`
		: S;

export type CamelCaseType<
	InputType extends Record< string, unknown > | object
> = {
	[ K in keyof InputType as SnakeToCamelCase< K > ]: InputType[ K ];
};

export type ShipmentRecord< T > = Record< `shipment_${ number | string }`, T >;
