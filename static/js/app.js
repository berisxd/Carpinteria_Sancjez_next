// Interacciones ligeras: reveal on scroll y manejo de foco para toggler
document.addEventListener('DOMContentLoaded', function(){
	// Reveal on scroll
	const observer = new IntersectionObserver((entries)=>{
		entries.forEach(entry=>{
			if(entry.isIntersecting){
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		})
	},{threshold:0.12});

	document.querySelectorAll('.reveal, .card-service, .hero-card, .gallery-grid img').forEach(el=>{
		el.classList.add('reveal');
		observer.observe(el);
	});

	// Smooth nav link focus + collapse on link click (mobile)
	document.querySelectorAll('a.nav-link').forEach(a=>{
		a.addEventListener('click', ()=>{
			const navbarCollapse = document.querySelector('.navbar-collapse');
			if(navbarCollapse && navbarCollapse.classList.contains('show')){
				const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse);
				bsCollapse.hide();
			}
		});
	});

	// Product modal: abrir imagen al click
	const productModalEl = document.getElementById('productModal');
	if(productModalEl){
		const productModal = new bootstrap.Modal(productModalEl);
		const modalTitle = productModalEl.querySelector('#productModalLabel');
		const modalImg = productModalEl.querySelector('#productModalImg');

		document.querySelectorAll('.product-card').forEach(card=>{
			card.addEventListener('click', ()=>{
				const src = card.getAttribute('data-src') || card.querySelector('img').src;
				const title = card.getAttribute('data-title') || '';
				modalTitle.textContent = title;
				modalImg.src = src;
				modalImg.alt = title;
				productModal.show();
			});
		});
	}
});