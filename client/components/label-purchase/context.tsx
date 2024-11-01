import React from 'react';
import type CurrencyFactory from '@woocommerce/currency';
import { createContext, useContext } from '@wordpress/element';
import {
	useAccountState,
	useCustomsState,
	useHazmatState,
	useLabelsState,
	usePackageState,
	useRatesState,
	useShipmentState,
	useTotalWeight,
} from './hooks';
import { useEssentialDetails } from './hooks/essential-details';

export interface LabelPurchaseContextType {
	orderItems: unknown[];
	storeCurrency: ReturnType< typeof CurrencyFactory >;
	hazmat: ReturnType< typeof useHazmatState >;
	packages: ReturnType< typeof usePackageState >;
	rates: ReturnType< typeof useRatesState >;
	shipment: Omit<
		ReturnType< typeof useShipmentState >,
		'getShipmentWeight'
	>;
	weight: ReturnType< typeof useTotalWeight > &
		Pick< ReturnType< typeof useShipmentState >, 'getShipmentWeight' >;
	customs: ReturnType< typeof useCustomsState >;
	labels: ReturnType< typeof useLabelsState >;
	account: ReturnType< typeof useAccountState >;
	essentialDetails: ReturnType< typeof useEssentialDetails >;
}

export const LabelPurchaseContext = createContext< LabelPurchaseContextType >(
	{} as LabelPurchaseContextType
);

export const useLabelPurchaseContext = () => {
	return useContext( LabelPurchaseContext );
};

interface LabelPurchaseContextProviderProps {
	initialValue: LabelPurchaseContextType;
	children: React.JSX.Element | React.JSX.Element[];
}

export const LabelPurchaseContextProvider = ( {
	children,
	initialValue,
}: LabelPurchaseContextProviderProps ): React.JSX.Element => (
	<LabelPurchaseContext.Provider value={ initialValue }>
		{ children }
	</LabelPurchaseContext.Provider>
);
