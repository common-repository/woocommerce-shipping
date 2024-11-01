import React from 'react';
import { createContext, useContext } from '@wordpress/element';
import { OriginAddress } from 'types';
import { useOriginAddressState } from './hooks';

interface ShippingSettingsContextType {
	originAddresses: ReturnType< typeof useOriginAddressState > & {
		addresses: OriginAddress[];
	};
}

export const ShippingSettingsContext =
	createContext< ShippingSettingsContextType >(
		{} as ShippingSettingsContextType
	);

export const useShippingSettingsContext = () => {
	return useContext( ShippingSettingsContext );
};

interface ShippingSettingsContextProviderProps {
	initialValue: ShippingSettingsContextType;
	children: React.JSX.Element | React.JSX.Element[];
}

export const ShippingSettingsContextProvider = ( {
	children,
	initialValue,
}: ShippingSettingsContextProviderProps ): React.JSX.Element => (
	<ShippingSettingsContext.Provider value={ initialValue }>
		{ children }
	</ShippingSettingsContext.Provider>
);
