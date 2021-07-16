/**
 * Scroll content up, down, left, or right with an
 * unknown number of scrolling items and variable
 * item size.
 */
class TEGMarquee {
	/**
	 * create a new marquee object
	 * @param {Object} Options
	 */
	constructor(Options) {
		let _TEGM = this;

		/**
		 * options to configure marquee object
		 * @type {{direction: string,
		 *         delay: number,
		 *         duration: number,
		 *         marqueeSelector: string,
		 *         mousePause: boolean,
		 *         timing: string}}
		 * @private
		 */
		_TEGM._options = {
			marqueeSelector : '#marquee', // CSS selector to find the marquee container
			direction       : TEGMarquee.D_UP, // direction of scroll
			duration        : 3, // move _distance in this many seconds, CSS transition-duration
			delay           : 0, // set up the objects then wait to start, analagous to CSS transition-delay
			/* Option "timing" is the value for the transition-timing-function CSS property.
			 * I can never remember these so here they are:
			 *
			 * linear - specifies a transition effect with the same speed from start to end (recommended and default)
			 * ease - specifies a transition effect with a slow start, then fast, then end slowly
			 * ease-in - specifies a transition effect with a slow start
			 * ease-out - specifies a transition effect with a slow end
			 * ease-in-out - specifies a transition effect with a slow start and end
			 * cubic-bezier(n,n,n,n) - lets you define your own values in a cubic-bezier function
			 */
			timing     : 'linear',
			mousePause : true, // if true, hovering the mouse over the marquee will pause the scroll
			// TODO allow items to begin the scroll from out of view
			// startVisible    : true,
		};

		// override settings with options sent via "new" statement
		_TEGM._options = {..._TEGM._options, ...Options};

		// find the marquee parent element
		_TEGM._marqueeContainer = document.querySelector(_TEGM._options.marqueeSelector);

		if (_TEGM._marqueeContainer === null) {
			throw `TEGMarquee cannot find the marquee container with selector "${_TEGM._options.marqueeSelector}"`;
		}

		/**
		 * monitor marquee visibility to reduce resources
		 * @type {IntersectionObserver}
		 * @private
		 */
		_TEGM._lastRatio = 0;
		_TEGM._marqueeObserver = new IntersectionObserver(changes => {
			                                                  changes.forEach(change => {

				                                                  // is the marquee visible?
				                                                  if (change.intersectionRatio === 0) {
					                                                  // if not, stop the scroll
					                                                  TEGMarquee.stop(_TEGM);

				                                                  } else {

					                                                  // the marquee is visible, is it running?
					                                                  if (!_TEGM._isRunning) {
						                                                  // if not then start the scroll
						                                                  TEGMarquee.start(_TEGM);
					                                                  } // end if running
				                                                  } // end if visible

				                                                  // save ratio for the next call
				                                                  _TEGM._lastRatio = change.intersectionRatio;
			                                                  }); // end loop through changes
		                                                  },
		                                                  {thresholds : [0, .1, 1]}); // end marqueeObserver

		_TEGM._marqueeObserver.observe(_TEGM._marqueeContainer);

		document.addEventListener('visibilitychange', (event) => {

			// is the document hidden?
			if (document.visibilityState === 'hidden') {
				// then stop the scroll
				TEGMarquee.stop(_TEGM);

			} else {
				// if visible then start the scroll
				TEGMarquee.start(_TEGM);
			}
		}); // end onVisibilityChange

		/**
		 * monitor scrolling object visibility to loop the scrolling
		 * @type {IntersectionObserver}
		 * @private
		 */
		_TEGM._scrollObserver = new IntersectionObserver(changes => {
			                                                 // element states: new and never visible, entered, exiting, exited
			                                                 changes.forEach(change => {
				                                                 let thisItem = _TEGM._marqueeContents.filter((thisElement) => { return thisElement.id === change.target.getAttribute('data-marqueeid'); })[0];

				                                                 // if it's leaving the view
				                                                 if (thisItem.lastRatio > change.intersectionRatio) {

					                                                 // if it's invisible
					                                                 if (change.intersectionRatio === 0) {
						                                                 /* remove what is now a useless duplicate
						                                                  *
						                                                  * This looks like a memory leak.
						                                                  */
						                                                 _TEGM._scrollObserver.unobserve(thisItem.element);
						                                                 _TEGM._marqueeContents = _TEGM._marqueeContents.filter((thisElement) => { return thisElement.id !== change.target.getAttribute('data-marqueeid'); });
						                                                 thisItem.remove();

					                                                 } else {
						                                                 // otherwise, duplicate the target to prevent blanks in the scroll
						                                                 let newItem = new TEGMElement(change.target.cloneNode(true), _TEGM._options.direction);
						                                                 _TEGM._marqueeContainer.append(newItem.element);
						                                                 _TEGM._marqueeContents.push(newItem);
						                                                 _TEGM.setStart(newItem);
						                                                 _TEGM._scrollObserver.observe(newItem.element);

						                                                 // if the marquee is running, scroll this item
						                                                 if (_TEGM._isRunning) {
							                                                 newItem.ontransitionend = () => { TEGMarquee.scrollItem(_TEGM, newItem); };
							                                                 TEGMarquee.scrollItem(_TEGM, newItem);
						                                                 }

					                                                 } // end if invisible

				                                                 } else {
					                                                 // otherwise, save visibility for next time
					                                                 thisItem.lastRatio = change.intersectionRatio;
				                                                 } // end if item is leaving the view
			                                                 }); // end loop through changes
		                                                 },
		                                                 {root : _TEGM._marqueeContainer, threshold : [0, .4]}); // end itemObserver

		/**
		 * keep track of whether the marquee is scrolling
		 * @type {boolean}
		 * @private
		 */
		_TEGM._isRunning = false;

		/**
		 * The distance in pixels the scrolling items will travel in
		 * each iteration is calculated so that a list of items with
		 * different widths and heights will travel uniformly.
		 * @type {number}
		 * @private
		 */
		_TEGM._scrollDistance = 0;

		/**
		 * collect the scrolling content items as TEGMElements
		 * @type {TEGMElement[]}
		 * @private
		 */
		_TEGM._marqueeContents = [];

		/**
		 * the last item in the scrolling order
		 * @type {TEGMElement}
		 * @private
		 */
		_TEGM._lastItem;

		/* Get shortest distance to scroll to make scrolling uniform
		 * for items with variable size. Collect scrolling elements
		 * as an array of TEGMElements.
		 */
		let children = _TEGM._marqueeContainer.children;

		if (children.length === 0) {
			throw `TEGMarquee cannot find any scrolling items in the marquee container`;
		}

		for (let index = 0; index < children.length; index++) {
			let thisItem     = new TEGMElement(children[index], _TEGM._options.direction),
			    thisDistance = _TEGM.isVertical() ? thisItem.offsetHeight : thisItem.offsetWidth;

			// collect the maximum distance
			_TEGM._scrollDistance = Math.max(_TEGM._scrollDistance, thisDistance);

			// set the initial position
			if (index === 0) {
				// initial position of first item is 0 until startVisible is implemented, if ever
				thisItem.style = `transition: none; ${_TEGM._options.direction}: 0`;
				// initialize lastItem for the rest of the list
				_TEGM._lastItem = thisItem;

			} else {
				// other items are based on previous item in scroll order
				_TEGM.setStart(thisItem);
			}

			// add to observer
			_TEGM._scrollObserver.observe(thisItem.element);
			// append to content array
			_TEGM._marqueeContents.push(thisItem);
		} // end loop through contents
	} // end constructor

	/**
	 * the acceptable values for direction of scroll
	 * @returns {string}
	 * @constructor
	 */
	static get D_DOWN() { return 'bottom'; }

	static get D_LEFT() { return 'left'; }

	static get D_RIGHT() { return 'right'; }

	static get D_UP() { return 'top'; }

	/**
	 * all valid direction values in an array
	 * @returns {string[]}
	 * @constructor
	 */
	static get DIRECTIONS() { return [TEGMarquee.D_UP, TEGMarquee.D_RIGHT, TEGMarquee.D_DOWN, TEGMarquee.D_LEFT]; }

	/**
	 * a collection of values used to initialize this marquee
	 * @returns {{direction: string, delay: number, duration: number, marqueeSelector: string, mousePause: boolean, mousePauseClass: string, startVisible: boolean, timing: string}}
	 */
	get options() { return this._options; }

	/**
	 * the HTMLElement which contains the scrolling content
	 * @returns {HTMLElement}
	 */
	get marqueeContainer() { return this._marqueeContainer; }

	/**
	 * an array of TEGMarqueeItems representing the contents
	 * which scroll in this marquee
	 * @returns {TEGMElement[]}
	 */
	get marqueeContents() { return this._marqueeContents; }

	/**
	 * the direction of scroll in this marquee, must be one of:
	 *
	 * TEGMarqwuee.D_UP
	 * TEGMarqwuee.D_RIGHT
	 * TEGMarqwuee.D_DOWN
	 * TEGMarqwuee.D_LEFT
	 *
	 * @returns {string}
	 */
	get direction() { return this._options.direction; }

	/**
	 * a value for CSS transition-duration
	 * @returns {number}
	 */
	get duration() { return this._options.duration; }

	/**
	 * a value analogous to CSS transition-delay,
	 * time to wait before beginning the scroll
	 * @returns {number}
	 */
	get delay() { return this._options.delay; }

	/**
	 * a value for CSS transition-timing-function
	 * @returns {string}
	 */
	get timing() { return this._options.timing; }

	/**
	 * whether to being scrolling inside the viewable area
	 * @returns {boolean}
	 */

	// get startVisible() { return this._options.startVisible; }

	/**
	 * the distance to scroll in each iteration
	 * @returns {number}
	 */
	get scrollDistance() { return this._scrollDistance; }

	/**
	 * the last item in the scroll
	 * @returns {TEGMElement}
	 */
	get lastItem() { return this._lastItem; }

	/**
	 * track the last item in the scroll
	 * @param {TEGMElement} newItem
	 */
	set lastItem(newItem) { this._lastItem = newItem; }

	/**
	 * whether the marquee is scrolling
	 * @returns {boolean}
	 */
	get isRunning() { return this._isRunning; }

	/**
	 * track whether the marquee is scrolling for the IntersectionObserver
	 * @param {boolean} isIt
	 */
	set isRunning(isIt) { this._isRunning = isIt; }

	/**
	 * Is the scrolling direction of this instance either up or down?
	 * @returns {boolean} true if direction is D_UP or D_DOWN
	 */
	isVertical() {
		return (this._options.direction === TEGMarquee.D_UP || this._options.direction === TEGMarquee.D_DOWN);
	}

	/**
	 * Begin the scrolling processes of this instance.
	 */
	doScroll() {
		let marqueeObject = this;

		// Does hovering the mouse pause the scroll?
		if (marqueeObject.options.mousePause) {
			// then set up the stop and start functions
			marqueeObject._marqueeContainer.onmouseenter = () => { TEGMarquee.stop(marqueeObject); };
			marqueeObject._marqueeContainer.onmouseleave = () => { TEGMarquee.start(marqueeObject); };
		}
		TEGMarquee.start(marqueeObject);
	} // end doScroll()

	/**
	 * Set the starting position for a new scroll. The scrolling
	 * item is placed just beyond the last item in the group and
	 * then becomes the new last item.
	 * @param {TEGMElement} marqueeItem
	 */
	setStart(marqueeItem) {
		let thisMarquee = this;

		switch (thisMarquee.direction) {
			case TEGMarquee.D_UP:
				marqueeItem.style = `transition: none; top: ${thisMarquee.lastItem.animationOffset + thisMarquee.lastItem.offsetHeight}px;`;
				break;

			case TEGMarquee.D_DOWN:
				marqueeItem.style = `transition: none; bottom: ${thisMarquee.lastItem.animationOffset + thisMarquee.lastItem.offsetHeight}px;`;
				break;

			case TEGMarquee.D_LEFT:
				marqueeItem.style = `transition: none; left: ${thisMarquee.lastItem.animationOffset + thisMarquee.lastItem.offsetWidth}px;`;
				break;

			case TEGMarquee.D_RIGHT:
				marqueeItem.style = `transition: none; right: ${thisMarquee.lastItem.animationOffset + thisMarquee.lastItem.offsetWidth}px;`;
				break;
		} // end switch (marqueeObject.direction)
		// this item becomes the new last item
		thisMarquee.lastItem = marqueeItem;
	}

	/**
	 * pause the scrolling
	 */
	pause() {
		let marqueeObject = this;

		for (let index = 0; index < marqueeObject.marqueeContents.length; index++) {
			let marqueeItem = marqueeObject.marqueeContents[index];
			// clear the transitionend handler
			marqueeItem.ontransitionend = null;
			marqueeItem.style = `transition: none; ${marqueeObject.direction}: ${marqueeItem.animationOffset}px;`;
		} // end loop through marquee contents
		marqueeObject.isRunning = false;
	} // end pause

	/**
	 * resume the scrolling
	 */
	play() {
		let marqueeObject = this;
		marqueeObject.isRunning = true;

		for (let index = 0; index < marqueeObject.marqueeContents.length; index++) {
			let marqueeItem = marqueeObject.marqueeContents[index];

			// renew the transition
			if (marqueeItem.ontransitionend === null) {
				marqueeItem.ontransitionend = () => { TEGMarquee.scrollItem(marqueeObject, marqueeItem); };
			}

			if (this.delay > 0) {
				setTimeout(TEGMarquee.scrollItem, marqueeObject.delay, marqueeObject, marqueeItem);

			} else {
				TEGMarquee.scrollItem(marqueeObject, marqueeItem);
			} // end if there's a delay
		} // end loop through marquee contents
	}

	/**
	 * Begin or continue a
	 * scrolling journey. This is called by an
	 * ontransitionend event handler.
	 * @param {TEGMarquee} marqueeObject
	 * @param {TEGMElement} marqueeItem
	 */
	static scrollItem(marqueeObject, marqueeItem) {
		marqueeItem.style =
			`transition: ${marqueeObject.direction} ${marqueeObject.duration}s ${marqueeObject.timing} 0s; ` +
			`${marqueeObject.direction}: ${marqueeItem.animationOffset - marqueeObject.scrollDistance}px;`;
	} // end scrollItem()

	/**
	 * Start scrolling all the items. This is called
	 * in an onmouseenter event handler if
	 * TEGMarquee.options.mousePause is true.
	 * @param {TEGMarquee} marqueeObject
	 */
	static start(marqueeObject) {
		marqueeObject.play();
	} // end start()

	/**
	 * Stop scrolling all the items. This is called
	 * in an onmouseleave event handler if
	 * TEGMarquee.options.mousePause is true.
	 * @param {TEGMarquee} marqueeObject
	 */
	static stop(marqueeObject) {
		marqueeObject.pause();
	} // end stop()
} // end TEGMarquee

class TEGMElement {
	/**
	 * @param {HTMLElement} newItem, a single content item of the scrolling marquee
	 * @param {string} direction, the direction the marquee item is scrolling the
	 *    values for which are defined by class TEGMarquee.D_*
	 */
	constructor(newItem, direction) {
		let _TEGME = this;

		/**
		 * the underlying scrolling HTMLElement
		 * @type {HTMLElement}
		 * @private
		 */
		_TEGME._element = newItem;

		if (!(newItem instanceof HTMLElement)) {
			console.error('TEGMElement Error: No HTMLElement provided.');
		}

		// set an identifier separate from any id attribute set by the initial HTML
		_TEGME._element.setAttribute('data-marqueeid', parseInt(Date.now() / Math.random()));

		/**
		 * the direction of scroll, must be one of TEGMarquee.DIRECTIONS
		 * @type {string}
		 * @private
		 */
		_TEGME._direction;

		if (TEGMarquee.DIRECTIONS.includes(direction)) {
			_TEGME._direction = direction;

		} else {
			_TEGME._direction = TEGMarquee.D_UP;
			console.error('TEGMElement Error: No scroll direction provided. Defaulted to TEGMarquee.D_UP.');
		}

		/**
		 * the value of IntersectionObserverEntry.intersectionRatio from
		 * the last call to the IntersectionObserver for this item
		 * @type {IntersectionObserverEntryInit.intersectionRatio}
		 * @private
		 */
		_TEGME._lastRatio = 0;
	}

	/**
	 * @returns {null|HTMLElement} this scrolling HTMLElement
	 */
	get element() { return this._element; }

	/**
	 * the direction of scroll, see TEGMarquee.D_* values
	 * @returns {string}
	 */
	get direction() { return this._direction; }

	// add shortcuts to HTMLElement properties

	/**
	 * @returns {number} height of HTMLElement in pixels
	 */
	get offsetHeight() { return this._element.offsetHeight; }

	/**
	 * @returns {number} width of HTMLElement in pixels
	 */
	get offsetWidth() { return this._element.offsetWidth; }

	get id() { return this._element.getAttribute('data-marqueeid'); }

	/**
	 * @returns {(this:GlobalEventHandlers, ev: TransitionEvent) => any} transitionend event handler, if any
	 */
	get ontransitionend() { return this._element.ontransitionend; }

	/**
	 * @param {(this:GlobalEventHandlers, ev: TransitionEvent) => any} endFunction, transitionend event handler
	 */
	set ontransitionend(endFunction) { this._element.ontransitionend = endFunction; }

	/**
	 * @returns {CSSStyleDeclaration} the style property of the underlying HTMLElement
	 */
	get style() { return this._element.style; }

	/**
	 * set the style property of the underlying HTMLElement
	 * @param {string} CSSString, styles to set
	 */
	set style(CSSString) { this._element.style = CSSString; }

	/**
	 * @returns {IntersectionObserverEntryInit.intersectionRatio}
	 */
	get lastRatio() { return this._lastRatio; }

	/**
	 * @param {number} intersectionRatio, should be the previous value of IntersectionObserverEntry.intersectionRatio
	 */
	set lastRatio(intersectionRatio) { this._lastRatio = intersectionRatio; }

	/**
	 * @returns {number} the current position of the item within
	 * the visible area as defined by the scrolling direction
	 */
	get animationOffset() {
		switch (this._direction) {
			case TEGMarquee.D_UP:
				// the position is the top
				return this._element.offsetTop;

			case TEGMarquee.D_DOWN:
				// the position is the distance from the bottom of the item to the bottom of the view
				return this._element.offsetParent.offsetHeight - (this._element.offsetTop + this._element.offsetHeight);

			case TEGMarquee.D_LEFT:
				// the position is the left
				return this._element.offsetLeft;

			case TEGMarquee.D_RIGHT:
				// the position is the distance from the right of the item to the right of the view
				return this._element.offsetParent.offsetWidth - (this._element.offsetLeft + this._element.offsetWidth);

			default:
				return 0;
		} // end switch (this.direction)
	} // end get animationOffset()

	// add shortcuts to HTMLElement methods
	remove() { this._element.remove(); }
} // end class TEGMElement
