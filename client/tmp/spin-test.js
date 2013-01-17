$spinHolder = $('#spin-holder', l.$content);

l.$window.scroll(function () {
	var scrollTop = l.$window.scrollTop();
	var scrollBottom = l.$window.scrollTop() + l.$window.height();
	var spinnerTop = $spinHolder.offset().top;
	if (spinnerTop > scrollTop && spinnerTop < scrollBottom && !l.spinner.el) {
		sendRequest();
	}
});

l.spinner.spin();
$spinHolder.append(l.spinner.el);

l.spinner.stop();
