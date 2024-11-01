import { useState } from '@wordpress/element';
export function useEssentialDetails() {
	const [ customsCompleted, setCustomsCompleted ] = useState( false );
	const [ shippingServiceCompleted, setShippingServiceCompleted ] =
		useState( false );
	const [ focusArea, setFocusArea ] = useState( '' );

	const isCustomsCompleted = () => {
		return customsCompleted;
	};

	const isShippingServiceCompleted = () => {
		return shippingServiceCompleted;
	};

	const resetFocusArea = () => {
		setFocusArea( '' );
	};

	return {
		isCustomsCompleted,
		setCustomsCompleted,
		isShippingServiceCompleted,
		setShippingServiceCompleted,
		focusArea,
		resetFocusArea,
		setFocusArea,
	};
}
