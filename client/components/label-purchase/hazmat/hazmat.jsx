/**
 * External dependencies
 */
import {
	__experimentalText as Text,
	Button,
	Dropdown,
	MenuItemsChoice,
	RadioControl,
	BaseControl,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { Link } from '@woocommerce/components';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { uspsHazmatCategories } from './usps-hazmat-categories';
import { useLabelPurchaseContext } from '../context';
import { recordEvent } from 'utils/tracks';
import { FOCUS_AREA_HAZMAT } from 'components/label-purchase/essential-details/constants';

const hazmatCategories = [];
Object.entries( uspsHazmatCategories ).forEach( ( [ value, label ] ) => {
	hazmatCategories.push( {
		label,
		value,
	} );
} );

const DropdownSelectedOption = ( { value } ) => {
	const selectedLabel = hazmatCategories.find(
		( category ) => category.value === value
	).label;
	return (
		<section>
			<Text truncate title={ selectedLabel }>
				{ selectedLabel }
			</Text>
		</section>
	);
};

export const Hazmat = () => {
	const {
		hazmat: { getShipmentHazmat, setShipmentHazmat },
		rates: { updateRates },
		labels: { hasPurchasedLabel },
		essentialDetails: { focusArea, resetFocusArea },
	} = useLabelPurchaseContext();

	const handleHazmatChange = ( value ) => {
		recordEvent( 'label_purchase_hazmat_toggled', { hazmat: value } );
		setShipmentHazmat(
			value === 'yes',
			getShipmentHazmat()?.category || ''
		);

		if ( typeof getShipmentHazmat()?.category === 'string' ) {
			updateRates();
		}

		if ( value === 'no' ) {
			resetFocusArea();
		}
	};

	const handleHazmatCategoryChange = ( value ) => {
		setShipmentHazmat( getShipmentHazmat()?.isHazmat || false, value );
		recordEvent( 'label_purchase_hazmat_category_selected', {
			hazmat_category: value,
		} );
		resetFocusArea();
		updateRates();
	};

	return (
		<div>
			<RadioControl
				className="hazmat-radio-control"
				label={ __(
					'Are you shipping dangerous goods or hazardous materials?',
					'woocommerce-shipping'
				) }
				selected={ getShipmentHazmat()?.isHazmat ? 'yes' : 'no' }
				options={ [
					{ label: __( 'No', 'woocommerce-shipping' ), value: 'no' },
					{
						label: __( 'Yes', 'woocommerce-shipping' ),
						value: 'yes',
					},
				] }
				onChange={ handleHazmatChange }
				disabled={ hasPurchasedLabel( false ) }
			/>

			{ getShipmentHazmat()?.isHazmat && (
				<div>
					<p>
						{ __(
							'Potentially hazardous material includes items such as batteries, dry ice, flammable liquids, aerosols, ammunition, fireworks, nail polish, perfume, paint, solvents, and more. Hazardous items must ship in separate packages.',
							'woocommerce-shipping'
						) }
					</p>
					<p>
						{ createInterpolateElement(
							__(
								"Learn how to securely package, label, and ship HAZMAT through USPS® at <a1>www.usps.com/hazmat</a1>. Determine your product's mailability using the <a2>USPS HAZMAT Search Tool</a2>.",
								'woocommerce-shipping'
							),
							{
								a1: (
									<Link
										target="_blank"
										href="https://www.usps.com/hazmat"
										type="external"
										rel="noreferrer"
									/>
								),
								a2: (
									<Link
										target="_blank"
										href="https://pe.usps.com/hazmat/index"
										type="external"
										rel="noreferrer"
									/>
								),
							}
						) }
					</p>
					<p>
						{ createInterpolateElement(
							__(
								'WooCommerce Shipping does not currently support HAZMAT shipments through <a>DHL Express</a>.',
								'woocommerce-shipping'
							),
							{
								a: (
									<Link
										type="external"
										target="_blank"
										href="https://www.dhl.com/us-en/home/express.html"
										rel="noreferrer"
									/>
								),
							}
						) }
					</p>

					<Dropdown
						className="hazmat-category-dropdown"
						contentClassName="hazmat-categories"
						popoverProps={ {
							placement: 'bottom-start',
							noArrow: false,
							resize: true,
							shift: true,
							inline: true,
						} }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<BaseControl
								help={ __(
									'Selecting a hazardous or dangerous material category is required.',
									'woocommerce-shipping'
								) }
								className={ {
									'has-error': ! Boolean(
										getShipmentHazmat()?.category
									),
								} }
								required={ true }
							>
								<Button
									onClick={ onToggle }
									aria-expanded={ isOpen }
									isSecondary
									icon={ chevronDown }
									iconPosition="right"
									className={ clsx(
										'hazmat-category__toggle',
										{
											'has-error':
												focusArea ===
													FOCUS_AREA_HAZMAT &&
												! Boolean(
													getShipmentHazmat()
														?.category
												),
										}
									) }
									disabled={ hasPurchasedLabel( false ) }
								>
									{ getShipmentHazmat()?.category === '' ? (
										__(
											'Select a hazardous or dangerous material category',
											'woocommerce-shipping'
										)
									) : (
										<section>
											<DropdownSelectedOption
												value={
													getShipmentHazmat()
														?.category || ''
												}
											/>
										</section>
									) }
								</Button>
							</BaseControl>
						) }
						renderContent={ ( { onToggle } ) => (
							<MenuItemsChoice
								choices={ hazmatCategories }
								onSelect={ ( value ) => {
									handleHazmatCategoryChange( value );
									onToggle();
								} }
								value={ getShipmentHazmat()?.category || '' }
							/>
						) }
					/>
				</div>
			) }
		</div>
	);
};
