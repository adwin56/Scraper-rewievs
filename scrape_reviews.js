const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // запуск браузера в видимом режиме
    const page = await browser.newPage();

    // Переход на страницу с отзывами
    await page.goto('https://www.google.ru/maps/place/Стоматологическая+клиника+Даймонд-Клиника+Горьковская+Ӏ+имплантация+зубов,+виниры/@56.3109185,43.99761,17z/data=!4m8!3m7!1s0x4151d5ed4c477dbb:0xa76f684cc157f9b7!8m2!3d56.3110243!4d44.0001199!9m1!1b1!16s%2Fg%2F11bzrhpp3j?entry=ttu', { waitUntil: 'networkidle2' });

    // Ждем появления блока отзывов
    const scrollableDivSelector = '.XiKgde'; // Замените на корректный селектор вашего блока
    await page.waitForSelector(scrollableDivSelector);

    // Прокрутка конкретного блока для загрузки всех отзывов
    await page.evaluate(async (scrollableDivSelector) => {
        const scrollableDiv = document.querySelector(scrollableDivSelector);
        
        if (!scrollableDiv) {
            throw new Error('Scrollable div not found');
        }

        let lastHeight = scrollableDiv.scrollHeight;
        while (true) {
            scrollableDiv.scrollBy(0, scrollableDiv.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 500)); // Ждем, чтобы новые элементы загрузились

            let newHeight = scrollableDiv.scrollHeight;
            if (newHeight === lastHeight) {
                break; // Выходим из цикла, если больше ничего не загрузилось
            }
            lastHeight = newHeight;
        }
    }, scrollableDivSelector);

    // Извлечение отзывов
    const reviews = await page.evaluate(() => {
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

    // Сохранение отзывов в файл JSON
    fs.writeFileSync('reviews.json', JSON.stringify(reviews, null, 2));

    console.log('Отзывы сохранены в файл reviews.json');

    await browser.close();
})();
