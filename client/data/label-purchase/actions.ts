import { apiFetch } from '@wordpress/data-controls';
import {
	ORDER_STATUS_UPDATE_FAILED,
	ORDER_STATUS_UPDATED,
	RATES_FETCH_FAILED,
	RATES_FETCHED,
	SHIPMENTS_UPDATE_FAILED,
	SHIPMENTS_UPDATED,
} from './action-types';
import { getRatesPath, getShipmentsPath, getWCOrdersPath } from 'data/routes';
import { select } from '@wordpress/data';
import { mapAddressForRequest } from 'utils';
import { OriginAddress } from 'types';
import { RatesFetchedAction, RatesFetchFailedAction } from './types.d';
import { addressStore } from '../address';

export function* updateShipments( {
	shipments,
	orderId,
	shipmentIdsToUpdate,
}: {
	shipments: unknown;
	orderId: string;
	shipmentIdsToUpdate: Record< string, number | string >;
} ): Generator<
	ReturnType< typeof apiFetch >,
	{
		type: typeof SHIPMENTS_UPDATED | typeof SHIPMENTS_UPDATE_FAILED;
		result?: unknown;
		error?: Record< string, string >;
	},
	{
		success: boolean;
		data: string; // JSON string
	}
> {
	try {
		const result = yield apiFetch( {
			path: getShipmentsPath( orderId ),
			method: 'POST',
			data: { shipments, shipmentIdsToUpdate },
		} );
		return {
			type: SHIPMENTS_UPDATED,
			result,
		};
	} catch ( error: unknown ) {
		return {
			type: SHIPMENTS_UPDATE_FAILED,
			error: error as Record< string, string >,
		};
	}
}

export function* getRates( payload: {
	orderId: string | number;
	origin: OriginAddress;
	packages: unknown[];
} ): Generator<
	ReturnType< typeof apiFetch >,
	RatesFetchedAction | RatesFetchFailedAction,
	{
		success: boolean;
		data: string; // JSON string
	}
> {
	const destination = select( addressStore ).getPreparedDestination();

	const { orderId, origin, ...restOfPayload } = payload;

	try {
		const result = yield apiFetch( {
			path: getRatesPath(),
			method: 'POST',
			data: {
				order_id: orderId,
				destination,
				// Todo: To be updated via  woocommerce-shipping/issues/859
				origin: mapAddressForRequest( origin ),
				...restOfPayload,
			},
		} );
		return {
			type: RATES_FETCHED,
			payload: result,
		};
	} catch ( error ) {
		return {
			type: RATES_FETCH_FAILED,
			payload: error as Record< string, string >,
		};
	}
}

export function* updateOrderStatus( {
	orderId,
	status,
}: {
	orderId: string;
	status: string;
} ): Generator<
	ReturnType< typeof apiFetch >,
	{
		type: typeof ORDER_STATUS_UPDATED | typeof ORDER_STATUS_UPDATE_FAILED;
		payload: { status: string } | { error: string };
	},
	{
		status: string;
	}
> {
	try {
		const result = yield apiFetch( {
			path: getWCOrdersPath( orderId ),
			method: 'PUT',
			data: { status },
		} );
		return {
			type: ORDER_STATUS_UPDATED,
			payload: result,
		};
	} catch ( error ) {
		return {
			type: ORDER_STATUS_UPDATE_FAILED,
			payload: { error: ( error as Error ).message },
		};
	}
}
