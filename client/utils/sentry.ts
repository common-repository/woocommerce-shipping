import * as Sentry from '@sentry/react';
import { getPluginRelativeDirectory } from './config';

export const initSentry = () => {
	Sentry.init( {
		dsn: 'https://971a8d22e72fade3cc3bc7ee7c0c2093@o248881.ingest.us.sentry.io/4506903329046528',
		integrations: [ Sentry.replayIntegration() ],
		environment: window.wcShippingSettings?.environment,
		release: 'wcshipping@' + window.wcShippingSettings?.version,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 0.3,
		// Only send errors to Sentry that comes WooCommerce or WooCommerce Shipping
		beforeSend( event ) {
			if ( event.exception?.values ) {
				const stacktrace = event.exception.values[ 0 ].stacktrace;

				// Check if stacktrace exists and contains the necessary frames
				if ( stacktrace?.frames ) {
					const isFromAllowedSource = stacktrace.frames.some(
						( frame ) => {
							// We only want to send errors that originate from files in the WooCommerce or WooCommerce Shipping folders.
							return (
								frame.filename?.includes(
									getPluginRelativeDirectory( true )
									// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
								) ||
								frame.filename?.includes(
									getPluginRelativeDirectory()
								)
							);
						}
					);

					// Return null to filter out the event, otherwise return the event
					if ( ! isFromAllowedSource ) {
						return null;
					}
				}
			}
			// If no filtering is needed, return the event as is
			return event;
		},
	} );

	Sentry.setTag(
		'wc_version',
		window.wc?.wcSettings.WC_VERSION ?? 'unknown version'
	);
};
