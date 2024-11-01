/**
 * Conditionaly render component A or B based on condition
 *
 * @param condition - function or object returning render and props as in {render: true, props: {foo: 'bar'}}
 * @param A React component
 * @param B React component
 * @returns React component
 */
export const Conditional = ( condition, A, B ) => ( componentProps ) => {
	/**
	 * If condition is a function, call it with componentProps
	 * Otherwise, use it as an object
	 * If function, it should return {render: true, props: {foo: 'bar'}},
	 * otherwise it should be {render: true, props: {foo: 'bar'}}
	 *
	 * @param {Object} condition - object or function
	 */
	const { render, props } =
		typeof condition === 'function'
			? condition( componentProps )
			: condition;
	if ( render ) {
		return <A { ...componentProps } { ...( props || {} ) } />;
	}
	return <B { ...componentProps } { ...( props || {} ) } />;
};
