const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // запуск браузера в видимом режиме
    const page = await browser.newPage();

    // Переход на страницу с отзывами
    await page.goto('https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu', { waitUntil: 'networkidle2' });

    let reviews = [];
    let previousHeight;

    while (true) {
        // Прокрутка страницы вниз
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // ожидание загрузки новых отзывов

        // Извлечение отзывов на текущей странице
        let newReviews = await page.evaluate(() => {
            const reviewNodes = document.querySelectorAll('.jftiEf.fontBodyMedium');

            const reviewsArray = [];
            reviewNodes.forEach(node => {
                const author = node.querySelector('.d4r55') ? node.querySelector('.d4r55').innerText : 'Неизвестный автор';
                const rating = node.querySelector('.kvMYJc') ? node.querySelector('.kvMYJc').getAttribute('aria-label').split(' ')[0] : 'Без рейтинга';
                const date = node.querySelector('.rsqaWe') ? node.querySelector('.rsqaWe').innerText : 'Дата отсутствует';
                const text = node.querySelector('.wiI7pd') ? node.querySelector('.wiI7pd').innerText : 'Текст отсутствует';

                reviewsArray.push({
                    author: author,
                    rating: rating,
                    date: date,
                    text: text
                });
            });

            return reviewsArray;
        });

        reviews = reviews.concat(newReviews);

        // Проверка на окончание страницы (нет новых отзывов для загрузки)
        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
            break;
        }
    }

    // Сохранение отзывов в файл JSON
    fs.writeFileSync('reviews.json', JSON.stringify(reviews, null, 2));

    console.log(`Отзывы сохранены в файл reviews.json. Всего отзывов: ${reviews.length}`);

    await browser.close();
})();
