document.addEventListener('DOMContentLoaded', (event) => {
	describe('TEG Marquee', function() {
		beforeAll(function() {
			window.TEGMUp = new TEGMarquee({
				                               marqueeSelector : '#marqueeUp',
				                               direction       : TEGMarquee.D_UP,
			                               });
			TEGMUp.doScroll();
			window.TEGMDown = new TEGMarquee({
				                                 marqueeSelector : 'ul.marqueeDown',
				                                 direction       : TEGMarquee.D_DOWN,
			                                 });
			TEGMDown.doScroll();
			window.TEGMLeft = new TEGMarquee({
				                                 marqueeSelector : '#marqueeLeft',
				                                 direction       : TEGMarquee.D_LEFT,
				                                 duration        : 5,
			                                 });
			TEGMLeft.doScroll();
			window.TEGMRight = new TEGMarquee({
				                                  marqueeSelector : 'ul.marqueeRight',
				                                  direction       : TEGMarquee.D_RIGHT,
				                                  duration        : 8,
			                                  });
			TEGMRight.doScroll();

			try {
				window.TEGMNone = new TEGMarquee({
					                                 marqueeSelector : '#noItem'
				                                 });
				TEGMNone.doScroll();
			} catch (error) {
				console.error(`Expected error: ${error}`);
			}

			try {
				window.TEGMnocontents = new TEGMarquee({
					                                       marqueeSelector : '#nocontents'
				                                       });
				TEGMnocontents.doScroll();
			} catch (error) {
				console.error(`Expected error: ${error}`);
			}
			jasmine.clock().install();
		});

		it('should create marquee objects', function() {
			expect(TEGMUp.direction).toBe(TEGMarquee.D_UP);
			expect(TEGMDown.direction).toBe(TEGMarquee.D_DOWN);
			expect(TEGMLeft.direction).toBe(TEGMarquee.D_LEFT);
			expect(TEGMRight.direction).toBe(TEGMarquee.D_RIGHT);
		}); // it('should create marquee objects')

		it('should handle a missing marquee', function() {
			expect(typeof TEGMNone).toBe('undefined');
		}); // end it('should handle a missing marquee')

		it('should handle an empty marquee', function() {
			expect(typeof TEGMNone).toBe('undefined');
		}); // end it('should handle an empty marquee')

		it('should stop when the mouse hovers over it', function() {
			TEGMDown.marqueeContainer.onmouseenter();
			expect(TEGMDown.isRunning).toBeFalse();
		}); // end it('should stop when the mouse hovers over it')

		it('should start when the mouse moves away', function() {
			TEGMUp.marqueeContainer.onmouseenter();
			TEGMUp.marqueeContainer.onmouseleave();
			expect(TEGMUp.isRunning).toBeTrue();
		}); // end it('should start when the mouse moves away')

		it('should stop when the marquee is out of view', function() {
			expect(TEGMRight.isRunning).toBeFalse();
		}); // end it('should stop when the marquee is out of view')

		it('should pause when told', function() {
			TEGMLeft.play();
			TEGMLeft.pause();
			expect(TEGMLeft.isRunning).toBeFalse();
		}); // end it('should pause when told')

		it('should play when told', function() {
			TEGMLeft.pause();
			TEGMLeft.play();
			expect(TEGMLeft.isRunning).toBeTrue();
		}); // end it('should play when told')
	}); // end describe('TEGMarquee')
}); // end wait for document
