import React, { JSX, ReactNode } from 'react';
import { useCallback, useRef, useState } from '@wordpress/element';
import { Button, Icon, type IconType, Popover } from '@wordpress/components';

interface ControlledPopoverProps {
	children: ReactNode;
	icon?: IconType;
	buttonText?: string;
	trigger?: 'click' | 'hover' | 'focus';
	withArrow?: boolean;
}

export const ControlledPopover = ( {
	children,
	icon,
	buttonText,
	trigger = 'click',
	withArrow = true,
}: ControlledPopoverProps ): JSX.Element => {
	const [ show, setShow ] = useState( false );
	const toggle = useCallback(
		() => setShow( ( prev ) => ! prev ),
		[ setShow ]
	);
	const btnRef = useRef( null );
	let triggerProps: Partial<
		Record<
			'onClick' | 'onMouseOver' | 'onMouseOut' | 'onFocus' | 'onBlur',
			typeof toggle
		>
	> = {
		onClick: toggle,
	};

	if ( trigger === 'hover' ) {
		triggerProps = {
			onMouseOver: toggle,
			onMouseOut: toggle,
		};
	}

	if ( trigger === 'focus' ) {
		triggerProps = {
			onFocus: toggle,
			onBlur: toggle,
		};
	}

	return (
		<>
			{ icon && (
				<Icon
					icon={ icon }
					ref={ ! buttonText ? btnRef?.current : undefined }
					aria-haspopup={ true }
					aria-expanded={ show }
					{ ...triggerProps }
				/>
			) }
			{ buttonText && (
				<Button
					{ ...triggerProps }
					ref={ ! icon ? btnRef?.current : undefined }
					aria-haspopup={ true }
					aria-expanded={ show }
					icon={ icon }
				>
					{ buttonText }
				</Button>
			) }
			{ show && (
				<Popover
					className="label-purchase-form-tooltip"
					onFocusOutside={ toggle }
					noArrow={ withArrow ? false : true }
					inline={ true }
					shift={ true }
					resize={ true }
					children={ children }
					anchor={ btnRef?.current }
				></Popover>
			) }
		</>
	);
};
