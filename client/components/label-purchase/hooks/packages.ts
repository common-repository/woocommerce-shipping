import { isEmpty } from 'lodash';
import { useCallback, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { labelPurchaseStore } from 'data/label-purchase';
import {
	getAccountSettings,
	getAvailableCarrierPackages,
	getAvailablePackagesById,
	getPackageDimensions,
} from 'utils';
import { CustomPackage, Package } from 'types';
import { defaultCustomPackageData } from '../constants';
import { CUSTOM_BOX_ID_PREFIX, PACKAGE_TYPES, TAB_NAMES } from '../packages';

export const getInitialPackageAndTab = (
	savedPackages: Package[]
): {
	initialTab: string;
	initialPackage: Package | null;
} => {
	const isUseLastBoxEnabled =
		getAccountSettings()?.purchaseSettings?.use_last_package;
	const lastBoxId = getAccountSettings()?.userMeta?.last_box_id;

	if ( isUseLastBoxEnabled && lastBoxId ) {
		const matchingSavedPackage = savedPackages.find(
			( { id } ) => id === lastBoxId
		);

		if ( matchingSavedPackage ) {
			return {
				initialTab: TAB_NAMES.SAVED_TEMPLATES,
				initialPackage: {
					...matchingSavedPackage,
					...( getPackageDimensions( matchingSavedPackage ) || {} ),
				},
			};
		}

		if ( getAvailableCarrierPackages() ) {
			const allCarrierPackagesById = getAvailablePackagesById();
			if ( Object.keys( allCarrierPackagesById ).includes( lastBoxId ) ) {
				return {
					initialTab: TAB_NAMES.CARRIER_PACKAGE,
					initialPackage: {
						...allCarrierPackagesById[ lastBoxId ],
						...( getPackageDimensions(
							allCarrierPackagesById[ lastBoxId ]
						) || {} ),
					},
				};
			}
		}
	}

	return {
		initialTab: TAB_NAMES.CUSTOM_PACKAGE,
		initialPackage: null,
	};
};

export function usePackageState(
	currentShipmentId: string,
	totalWeight: number
) {
	const savedPackages = useSelect(
		( select ) => select( labelPurchaseStore ).getSavedPackages(),
		[ currentShipmentId ]
	);
	const { initialTab, initialPackage } =
		getInitialPackageAndTab( savedPackages );

	const [ currentPackageTab, setCurrentPackageTab ] = useState( initialTab );
	const [ customPackageData, setCustomPackageData ] = useState<
		Record< string, CustomPackage >
	>( {
		[ currentShipmentId ]: defaultCustomPackageData,
	} );
	const [ selectedPackage, setSelected ] = useState<
		Record< string, Package | CustomPackage | null >
	>( {
		[ currentShipmentId ]: initialPackage,
	} );

	const setCustomPackage = useCallback(
		( data: CustomPackage ) => {
			setCustomPackageData( ( prev ) => ( {
				...( prev || {} ),
				[ currentShipmentId ]: data,
			} ) );
		},
		[ currentShipmentId ]
	);

	const hasDistinctDimensions = (
		pkg: CustomPackage | Package
	): pkg is CustomPackage =>
		Object.hasOwn( pkg, 'length' ) &&
		Object.hasOwn( pkg, 'width' ) &&
		Object.hasOwn( pkg, 'height' );

	const setSelectedPackage = useCallback(
		( pkg: Package | CustomPackage ) => {
			setSelected( ( prev ) => ( {
				...( prev || {} ),
				[ currentShipmentId ]: {
					...pkg,
					...( hasDistinctDimensions( pkg )
						? pkg
						: getPackageDimensions( pkg ) || {} ),
				},
			} ) );
		},
		[ currentShipmentId ]
	);

	const getCustomPackage = () => {
		if ( customPackageData[ currentShipmentId ] ) {
			return {
				...customPackageData[ currentShipmentId ],
				isLetter:
					customPackageData[ currentShipmentId ].type ===
					PACKAGE_TYPES.ENVELOPE,
			};
		}
		return defaultCustomPackageData;
	};

	const getSelectedPackage = useCallback(
		() => selectedPackage[ currentShipmentId ],
		[ selectedPackage, currentShipmentId ]
	);

	const isCustomPackageTab = () =>
		currentPackageTab === TAB_NAMES.CUSTOM_PACKAGE;
	const getPackageForRequest = () =>
		isCustomPackageTab()
			? getCustomPackage()
			: ( getSelectedPackage() as Package );

	const isSelectedASavedPackage = useCallback( () => {
		return savedPackages.some( ( p ) => p.id === getSelectedPackage()?.id );
	}, [ savedPackages, getSelectedPackage ] );

	const isPackageSpecified = () => {
		if ( totalWeight === 0 ) return false;

		if ( currentPackageTab === TAB_NAMES.CUSTOM_PACKAGE ) {
			const { width, height, length } = getCustomPackage();
			return [ width, height, length ]
				.map( parseFloat )
				.every( ( dimension ) => dimension > 0 );
		}
		if ( currentPackageTab === TAB_NAMES.CARRIER_PACKAGE ) {
			return (
				! isEmpty( getSelectedPackage() ) &&
				! getSelectedPackage()?.id.includes( CUSTOM_BOX_ID_PREFIX )
			);
		}

		// currentPackageTab === TAB_NAMES.SAVED_TEMPLATES
		return ! isEmpty( getSelectedPackage() ) && isSelectedASavedPackage();
	};

	return {
		getCustomPackage,
		setCustomPackage,
		getSelectedPackage,
		setSelectedPackage,
		currentPackageTab,
		setCurrentPackageTab,
		getPackageForRequest,
		isPackageSpecified,
		isSelectedASavedPackage,
		isCustomPackageTab,
	};
}
