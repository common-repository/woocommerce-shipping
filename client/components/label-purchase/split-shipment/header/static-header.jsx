import { CheckboxControl, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const StaticHeader = ( {
	hasVariations,
	selectAll,
	selections = [],
	selectablesCount = 0,
	hasMultipleShipments = false,
} ) => (
	<Flex as="dl" gap={ 0 }>
		<CheckboxControl
			onChange={ selectAll }
			checked={ selections.length === selectablesCount }
			indeterminate={
				selections.length > 0 && selections.length < selectablesCount
			}
			style={ {
				visibility: ! hasMultipleShipments ? 'visible' : 'hidden',
			} }
		/>
		<dt className="item-name">
			{ __( 'Product', 'woocommerce-shipping' ) }
		</dt>
		<dt className="item-quantity">
			{ __( 'Quantity', 'woocommerce-shipping' ) }
		</dt>
		{ hasVariations && (
			<dt className="item-variation">
				{ __( 'Variation', 'woocommerce-shipping' ) }
			</dt>
		) }
		<dt className="item-weight">
			{ __( 'Weight', 'woocommerce-shipping' ) }
		</dt>
		<dt className="item-price">
			{ __( 'Price', 'woocommerce-shipping' ) }
		</dt>
	</Flex>
);
