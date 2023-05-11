
function createAppendMarquee() {
  let count = -1;

  return function (text, bg) {
    ++count;

    return `
    <script>
    document.addEventListener('DOMContentLoaded', function (event) {
      const el = document.createElement('marquee')
      el.id = "banner-${count}"
      el.style.background = 'red'
      el.style.color = 'white'
      el.innerHTML = '${text}'
      el.style.width = '100%'
      el.style.background = '${bg}'
      el.style.color = 'white'
      el.style['font-family'] = 'sans-serif'
      el.style.top = '${30 * count}px'
      el.style.left = '0'
      el.style.margin = '0'
      el.style.border = '0'
      el.style['border-radius'] = '0'
      el.style['font-size'] = '16px'
      el.style.padding = '6px'
      el.style.position = 'fixed'
      el.style.display = 'block'
      el.style['z-index'] = '100000'
      document.querySelector('body').appendChild(el)
    })
    </script>
    `.trim();
  }
}

async function fetchRequest(url) {
  const response = await fetch(url);
  const content = await response.text();

  const appendMarquee = createAppendMarquee();

  const banners = [
    appendMarquee(
      'Served by My Edge Runtime, check: https://github.com/zhangxiang958/my-edge-runtime',
      '#111'
    )
  ];

  return new Response(`${banners.join()}\n${content}`, {
    headers: {
      'Content-type': 'text/html; charset=UTF-8',
    }
  });
}

addEventListener('fetch', event => {
  const { searchParams } = new URL(event.request.url);
  const url = searchParams.get('url') || 'https://rumt-zh.com';
  return event.respondWith(fetchRequest(url));
});
