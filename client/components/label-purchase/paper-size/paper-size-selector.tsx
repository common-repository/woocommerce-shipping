import { Button, Dropdown, Flex } from '@wordpress/components';
import { check, chevronDown } from '@wordpress/icons';
import React from 'react';
import { withBoundary } from 'components/HOC';
import { useLabelPurchaseContext } from '../context';

interface PaperSizeSelectorProps {
	disabled?: boolean;
}

export const PaperSizeSelector = withBoundary(
	( { disabled = false }: PaperSizeSelectorProps ) => {
		const {
			labels: { selectedLabelSize, setLabelSize, paperSizes },
		} = useLabelPurchaseContext();

		const selectSize =
			(
				size: {
					key: string;
					name: string;
				},
				close: () => void
			) =>
			() => {
				setLabelSize( size );
				close();
			};
		return (
			<Dropdown
				className="paper-size-selector"
				popoverProps={ {
					inline: true,
					noArrow: false,
				} }
				renderContent={ ( { onClose } ) => (
					<Flex direction="column">
						{ paperSizes.map( ( { key, name } ) => (
							<Button
								key={ key }
								variant="tertiary"
								icon={
									key === selectedLabelSize.key ? check : null
								}
								onClick={ selectSize(
									{
										key,
										name,
									},
									onClose
								) }
							>
								{ name }
							</Button>
						) ) }
					</Flex>
				) }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						variant="secondary"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						icon={ chevronDown }
						className="paper-size-selector__toggle"
						disabled={ disabled }
					>
						<span>{ selectedLabelSize.name }</span>
					</Button>
				) }
			/>
		);
	}
)( 'PaperSizeSelector' );
