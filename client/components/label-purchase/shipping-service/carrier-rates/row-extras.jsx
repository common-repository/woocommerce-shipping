import {
	__experimentalText as Text,
	CheckboxControl,
	Flex,
	Icon,
} from '@wordpress/components';
import { check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

export const RowExtras = ( {
	extrasText,
	signatureRequiredRate,
	adultSignatureRequiredRate,
	rate,
	formatAmount,
	setSelected,
	selected,
} ) => (
	<Flex direction="column" className="rate-extras">
		{ extrasText.map( ( text ) => (
			<Flex key={ text } justify="flex-start" gap={ 2 }>
				<Icon icon={ check } size={ 20 } />
				<Text key={ text } weight={ 400 }>
					{ text }
				</Text>
			</Flex>
		) ) }
		{ signatureRequiredRate && (
			<Flex>
				<CheckboxControl
					label={ sprintf(
						// translators: %s the cost of the additional service.
						__(
							'Signature Required ( +%s )',
							'woocommerce-shipping'
						),
						formatAmount( signatureRequiredRate.rate - rate.rate )
					) }
					onChange={ setSelected( signatureRequiredRate, rate ) }
					checked={
						signatureRequiredRate.rateId === selected?.rate?.rateId
					}
				/>
			</Flex>
		) }
		{ adultSignatureRequiredRate && (
			<Flex>
				<CheckboxControl
					label={ sprintf(
						// translators: %s the cost of the additional service.
						__(
							'Adult Signature Required ( +%s )',
							'woocommerce-shipping'
						),
						formatAmount(
							adultSignatureRequiredRate.rate - rate.rate
						)
					) }
					onChange={ setSelected( adultSignatureRequiredRate, rate ) }
					checked={
						adultSignatureRequiredRate.rateId ===
						selected?.rate?.rateId
					}
				/>
			</Flex>
		) }
	</Flex>
);
