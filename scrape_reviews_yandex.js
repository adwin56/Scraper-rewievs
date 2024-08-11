const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let allReviews = [];

    try {
        console.log('Запуск браузера...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Парсинг отзывов с Google Maps
        console.log('Переход на страницу с отзывами на Google Maps...');
        await page.goto('https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu', { waitUntil: 'networkidle2' });

        const scrollableDivSelectorGoogle = '.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde';
        console.log('Ожидание появления блока отзывов на Google Maps...');
        await page.waitForSelector(scrollableDivSelectorGoogle);

        console.log('Прокрутка блока на Google Maps...');
        await page.evaluate(async (selector) => {
            const scrollableDiv = document.querySelector(selector);
            if (!scrollableDiv) {
                console.error('Ошибка: прокручиваемый блок не найден!');
                return;
            }
            const scrollStep = 500;
            let lastHeight = scrollableDiv.scrollHeight;
            let attempt = 0;
            while (attempt < 20) {
                scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, 2000));
                let newHeight = scrollableDiv.scrollHeight;
                if (newHeight === lastHeight) {
                    break;
                }
                lastHeight = newHeight;
                attempt++;
            }
        }, scrollableDivSelectorGoogle);

        console.log('Извлечение отзывов с Google Maps...');
        const googleReviews = await page.evaluate(() => {
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
        allReviews = allReviews.concat(googleReviews);

// Парсинг отзывов с Яндекс Карт

console.log('Переход на страницу с отзывами на Яндекс Картах...');
await page.goto('https://yandex.ru/maps/org/daymond_klinik/164798670887/reviews/?indoorLevel=1&ll=49.123700%2C55.790012&z=16', { waitUntil: 'networkidle2' });

console.log('Извлечение отзывов с Яндекс Картах...');
const yandexReviews = await page.evaluate(() => {
    const reviewNodes = document.querySelectorAll('.business-review-view__info');
    const reviewsArray = [];
    reviewNodes.forEach(node => {
        const author = node.querySelector('.business-review-view__author-name') ? node.querySelector('.business-review-view__author-name').innerText : 'Неизвестный автор';
        const date = node.querySelector('.business-review-view__date') ? node.querySelector('.business-review-view__date').innerText : 'Дата отсутствует';

        const fullStars = node.querySelectorAll('.business-rating-badge-view__star._full').length;
        const emptyStars = node.querySelectorAll('.business-rating-badge-view__star._empty').length;
        const rating = fullStars + emptyStars > 0 ? fullStars : 'Без рейтинга';

        const reviewText = node.querySelector('.business-review-view__body-text') ? node.querySelector('.business-review-view__body-text').innerText : 'Текст отсутствует';

        reviewsArray.push({
            author: author,
            rating: rating,
            date: date,
            text: reviewText
        });
    });
    return reviewsArray;
});
allReviews = allReviews.concat(yandexReviews);
console.log('Количество отзывов с Google Maps:', googleReviews.length);
console.log('Количество отзывов с Яндекс Карт:', yandexReviews.length);

// Сохранение всех отзывов в один файл JSON
console.log('Сохранение всех отзывов в файл JSON...');
fs.writeFileSync('reviews2.json', JSON.stringify(allReviews, null, 2));
console.log('Все отзывы сохранены в файл reviews2.json');

await browser.close();
console.log('Браузер закрыт.');
} catch (error) {
console.error('Ошибка выполнения скрипта:', error);
}
})();