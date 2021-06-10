class TEGMarquee {
	constructor(Options) {
		let _TEGM = this;

		_TEGM._options = {
			marqueeElement : {},
			scrollDistance : 60, // distance to move in pixels
			animationRate  : 0.03, // move scrollDistance in this many seconds
			easing         : 'linear', //
		};

		// override settings with options sent via "new" statement
		_TEGM._options = {..._TEGM._options, ...Options};
	}

	get options() { return this._options; }

	get marqueeHeight() {
		return this._options.marqueeElement.innerHeight;
	}

	get marqueeElements() {
		return this._options.marqueeElement.children;
	}

	get delay() {

		if (this._options.marqueeElement.height() > 0) {
			return parseInt(this._options.marqueeElement.height() / this._options.animationRate);

		} else {
			return 0;
		}
	}

	get easing() { return this._options.easing; }

	doScroll() {
		TEGMarquee.scrollItem(this);
	}

	static scrollItem(marqueeObject) {

		for (var counter = 0; counter < marqueeObject.marqueeElements.length; counter++) {
			var thisMarqueeItem = marqueeObject.marqueeElements.eq(counter),
			    elementTop      = thisMarqueeItem.position().top;

			if (elementTop < -1 * thisMarqueeItem.height()) {
				elementTop = marqueeObject.marqueeHeight;
				thisMarqueeItem.css('top', elementTop);
			}
			thisMarqueeItem.animate({top : elementTop - marqueeObject.options.scrollDistance}, marqueeObject.delay, marqueeObject.easing,
			                        function() { TEGMarquee.scrollItem(marqueeObject) });
		}
	}
}
