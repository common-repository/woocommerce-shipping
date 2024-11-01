=== WooCommerce Shipping ===
Contributors: woocommerce, automattic, harriswong, waclawjacek, samnajian, kloon, ferdev, kallehauge, samirthemerchant, dustinparkerwebdev
Tags: woocommerce, shipping, usps, dhl, labels
Requires Plugins: woocommerce
Requires PHP: 7.4
Requires at least: 6.4
Tested up to: 6.6
WC requires at least: 9.1
WC tested up to: 9.3
Stable tag: 1.2.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A free shipping plugin for US merchants to print discounted shipping labels and compare live label rates directly from your WooCommerce dashboard.

== Description ==

Save time and money with WooCommerce Shipping. This dedicated shipping plugin allows you to print discounted shipping labels and compare live label rates with just a few clicks. There is no need to spend time setting up individual carrier accounts as everything is done directly from your WooCommerce dashboard.

With WooCommerce Shipping, critical services are hosted on Automattic’s best-in-class infrastructure, rather than relying on your store’s hosting. That means your store will be more stable and faster.

To start shipping, simply install this free plugin, create a WooCommerce account, and start saving time and money on your packages.

= Print USPS and DHL shipping labels and get heavily discounted rates =
Ship domestically and internationally right from your WooCommerce dashboard. Print USPS and DHL labels and instantly save up to 90%. All shipments are 100% carbon-neutral. More carriers are coming soon.

= Compare live shipping label rates =
Compare live rates across carriers to make sure you get the best price without guesswork or complex math.

= Split shipments =
Send orders in multiple shipments as products become ready.

= Optimized tracking =
Our built-in Shipment Tracking feature makes it easier for you and your customers to manage tracking numbers by automatically adding tracking IDs to “Order Complete” emails.

= Address verification at checkout =
Say goodbye to undeliverable packages and the hassle of managing incorrect addresses by enabling address verification at checkout. Including your customers in the shipping process will reduce failed deliveries, costly returns, and guesswork.

= Supported store countries and currencies =
WooCommerce Shipping currently only supports stores shipping from the following countries and using the following currencies. Please note you can still ship internationally, this is only applicable to your store's location.

**Store countries**
- United States (US)
- American Samoa (AS)
- Puerto Rico (PR)
- United States Virgin Islands (VI)
- Guam (GU)
- Northern Mariana Islands (MP)
- United States Minor Outlying Islands (UM)
- Federated States of Micronesia (FM)
- Marshall Islands (MH)

**Store currencies**
- United States Dollar (USD)

== Installation ==

This section describes how to install the plugin and get it working.

1. Install and activate WooCommerce if you haven't already done so
1. Upload the plugin files to the `/wp-content/plugins/woocommerce-shipping` directory, or install the plugin through the WordPress plugins screen directly.
1. Activate the plugin through the 'Plugins' screen in WordPress
1. Connect to your WordPress.com account if you haven't already done so
1. Want to buy shipping labels? First, add your credit card to https://wordpress.com/me/purchases/billing and then print labels for orders right from the Edit Order page

== Frequently Asked Questions ==

= What external services does this plugin rely on? =

This plugin relies on the following external services:

1. WordPress.com connection:
	- Description: The plugin makes requests to our own endpoints at WordPress.com (proxied via https://api.woocommerce.com) to fetch shipping rates, verify addresses, and purchase shipping labels.
	- Website: https://wordpress.com/
	- Terms of Service: https://wordpress.com/tos/
	- Privacy Policy: https://automattic.com/privacy/
2. WooCommerce Usage Tracking:
	- Description: The plugin will send usage statistics, provided the user has opted into WooCommerce Usage Tracking.
	- Script: https://pixel.wp.com/t.gif
	- Terms of Service: https://wordpress.com/tos/
	- Privacy Policy: https://automattic.com/privacy/
3. Sentry.io:
	- Description: The plugin catches critical errors in the user interface and sends a summary of the technical issue to Sentry for debugging purposes.
	- Website: https://sentry.io/
	- Terms of Service: https://sentry.io/terms/
	- Privacy Policy: https://sentry.io/privacy/
4. Sift.com:
	- Description: The plugin utilizes Sift (a fraud prevention and risk management platform) to calculate fraud scores for shipping label purchases made through the WordPress admin interface.
	- Website: https://sift.com/
	- Script: https://cdn.sift.com/s.js
	- Terms of Service: https://sift.com/legal-and-compliance/tos/
	- Privacy Policy: https://sift.com/legal-and-compliance/service-privacy-notice

= Do I need to use WooCommerce Tax or Jetpack? =

There’s no need to have Jetpack or WooCommerce Tax installed on your site — the new experience connects directly through your WordPress.com account for speed and simplicity.

= Why is a WordPress.com account connection required? =

We connect to your WordPress.com account to authenticate your site and user account so we can securely charge the payment method on file for any labels purchased.

= What shipping carriers are currently supported? =

* USPS
* DHL

With more carrier support in the works.

= Can I buy and print shipping labels for US domestic and international packages? =

Yes! You can buy and print USPS shipping labels for domestic destinations and USPS and DHL shipping labels for international destinations. Shipments need to originate from the U.S.

= This works with WooCommerce, right? =

Yep! We follow the L-2 policy, meaning if the latest version of WooCommerce is 8.7, we support back to WooCommerce version 8.5.

= Are there Terms of Service? =

Absolutely! You can read our Terms of Service [here](https://wordpress.com/tos).

== Screenshots ==
1. WooCommerce Shipping label purchase screen.
2. WooCommerce Shipping split shipment screen.
3. WooCommerce Shipping multiple origin address selection.
4. WooCommerce Shipping print label screen.
5. WooCommerce Shipping address validation at checkout suggestion.

== Changelog ==

= 1.2.1 - 2024-10-17 =
* Fix   - Issue with excessive rendering of the shipping label success view.

= 1.2.0 - 2024-10-16 =
* Add   - Option to allow shipping address validation at checkout.
* Fix   - A failed payment would hinder future purchases.
* Tweak - Do not cache new shipping API endpoints.
* Tweak - Improve asset file versioning.

= 1.1.5 - 2024-10-02 =
* Fix   - A single order being shipped within the same country and internationally could cause confusion with the customs form.
* Fix   - Changing a shipment's origin or destination address was not being reflected correctly throughout the entire UI.
* Fix   - Total shipment weight exceeding 1k caused the total weight field to be blank.
* Fix   - Moving shipment items to another shipment can cause the app to crash under certain conditions.
* Fix   - Shipping labels now hide the origin name when the origin address includes a company name.
* Dev   - New `wcshipping_include_email_tracking_info` filter so 3rd party plugins can enable/disable tracking info in emails.

= 1.1.4 - 2024-09-25 =
* Add   - Automate address verification for shipping address on the purchase screen.
* Add   - Improve the purchase status header during the purchase process
* Tweak - Improve timestamp handling on plugin status page.
* Fix   - Selectively migrate WooCommerce Shipping & Tax packages if WCShipping created its own new settings.
* Fix   - Don't remove non-compact options prefixed with "wc_connect_" on uninstallation.
* Fix   - Focusing in the custom package form doesn't deactivate the "Get rates button" button.
* Fix   - Ensure custom items stay in sync with the shipment items.
* Fix   - Surface payment errors to the user.
* Fix   - Remember dismissal of migration banners.
* Fix   - Customs form's weight to represent the total weight instead of individual line item weight.

= 1.1.3 - 2024-09-18 =
* Add   - Remember last order complete checkbox state for next label purchase.
* Add   - Automatically fetch rates on label purchase modal load when all conditions are met for fetching rates.
* Add   - Load the settings data from DB.
* Fix   - Ensure tracking numbers link to the correct carrier tracking url when using the Shipment Tracking extension.
* Fix   - Customs form's value to represent the total value instead of individual line item value.
* Fix   - Hide virtual products in the shipping label modal.
* Tweak - Improve error handling when purchasing shipping labels.
* Dev   - Ensure all API endpoints are loaded using the correct hook.

= 1.1.2 - 2024-09-13 =
* Add   - Functionality to delete saved packages and remove starred carrier packages.
* Add   - Added a package weight field to the save template form.
* Tweak - Store the name of the package that was used for a shipping label as part of the shipping label metadata.
* Tweak - Support product customs data created by WooCommerce Shipping & Tax when purchasing new shipping labels.
* Tweak - Improve error handling when purchasing shipping labels.
* Fix   - Improve responsive behaviour of the "Shipping Label" meta box on order edit pages.
* Fix   - Hide virtual products in the shipping label modal.
* Fix   - Nested items in the split shipment modal was missing dimension units.
* Fix   - Hide WooCommerce Shipping & Tax migration banners if there are no previous history.
* Fix   - Update the background order form when using the "Mark order as completed" option.
* Fix   - Hide "Mark as complete" option on already completed orders.

= 1.1.1 - 2024-09-06 =
* Fix   - Get rates button doesn't get active after correcting customs information.
* Fix   - Accessing products from old labels when migrating shipments causes the process to stall.

= 1.1.0 - 2024-09-03 =
* Add   - Support for migrating WooCommerce Shipping & Tax labels and settings.
* Add   - Tooltip to explain disabled delete button on default origin address.
* Add   - Necessary endpoints to load the plugin dynamically in WooCommerce.
* Add   - Allow the WooCommerce mobile app to access API.
* Tweak - Move shipment tracking metabox to upper position.
* Fix   - Browser always ask to exit the settings screen after settings has been saved.
* Fix   - Force shipments with a purchased label to be locked.
* Fix   - Loading plugin version in Loader class.

= 1.0.5 - 2024-08-21 =
* Add   - Show error in Onboarding Connection component.
* Fix   - Conflict with Jetpack connection class.
* Tweak - Change to sender checkbox text on the customs form.
* Tweak - Added new "source" parameter to the /wpcom-connection endpoint.

= 1.0.4 - 2024-08-13 =
* Add   - New Connect component on the shipping settings page.
* Add   - Upload sourcemaps to sentry.
* Add   - Hook into WPCOM Connection dependency list to communicate we share logic with e.g. WooCommerce.
* Tweak - Make composer package versions specific.
* Tweak - Show confirmation banner after accepting Terms of Service.
* Tweak - Hide connect banners if store currency is not supported by WooCommerce Shipping.
* Tweak - Hide connect banners on the WooCommerce Shipping settings page.

= 1.0.3 - 2024-08-02 =
* Fix - Error accessing the continents API endpoint.

= 1.0.2 - 2024-07-30 =
* Tweak - WordPress 6.6 Compatibility.
* Add   - Display the NUX banner on HPOS Order pages.

= 1.0.1 - 2024-06-24 =
* Tweak - Adhering to the plugin review standards.

= 1.0.0 - 2024-04-18 =
* Initial release.

== Upgrade Notice ==

= 1.1.0 =
This release includes an automated migration routine for all your existing WooCommerce Shipping & Tax labels and settings.
