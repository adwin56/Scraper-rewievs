const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Запуск браузера...');
        const browser = await puppeteer.launch({ headless: false }); // запуск браузера в видимом режиме
        const page = await browser.newPage();

        // Переход на страницу с отзывами
        console.log('Переход на страницу с отзывами...');
        await page.goto('https://yandex.ru/maps/org/daymond_klinik/164798670887/reviews/?indoorLevel=1&ll=49.123700%2C55.790012&z=16', { waitUntil: 'networkidle2' });

        // Ждем появления блока отзывов
        const scrollableDivSelector = '.business-review-view__info'; // Замените на корректный селектор вашего блока
        console.log('Ожидание появления блока отзывов...');
        await page.waitForSelector(scrollableDivSelector);

        console.log('Проверка и прокрутка блока...');
        // Прокрутка конкретного блока для загрузки всех отзывов
        await page.evaluate(async (selector) => {
            const scrollableDiv = document.querySelector(selector);

            if (!scrollableDiv) {
                console.error('Ошибка: прокручиваемый блок не найден!');
                return;
            }

            console.log('Блок найден. Начинается прокрутка...');
            const scrollStep = 500;
            let lastHeight = scrollableDiv.scrollHeight;
            let attempt = 0;
            while (attempt < 20) { // Увеличено количество попыток
                scrollableDiv.scrollTop = scrollableDiv.scrollHeight; // Прокрутка до низа
                console.log(`Попытка ${attempt + 1}: высота до ${lastHeight}, высота после ${scrollableDiv.scrollHeight}`);

                await new Promise(resolve => setTimeout(resolve, 2000)); // Подождем 2 секунды, чтобы новые элементы загрузились

                let newHeight = scrollableDiv.scrollHeight;
                console.log(`Высота после ожидания ${newHeight}`);

                if (newHeight === lastHeight) {
                    console.log('Прокрутка завершена, новых отзывов не загружено.');
                    break; // Выходим из цикла, если больше ничего не загрузилось
                }
                lastHeight = newHeight;
                attempt++;
            }
        }, scrollableDivSelector);

        console.log('Извлечение отзывов...');
        // Извлечение отзывов
        const reviews = await page.evaluate(() => {
            const reviewsArray = [];
            const reviewNodes = document.querySelectorAll('.business-review-view__info'); // Обновите селектор в зависимости от структуры HTML

            reviewNodes.forEach(node => {
                const author = node.querySelector('.business-review-view__author-name') ? node.querySelector('.business-review-view__author-name').innerText : 'Неизвестный автор';
                const date = node.querySelector('.business-review-view__date') ? node.querySelector('.business-review-view__date').innerText : 'Дата отсутствует';

                // Подсчет количества звезд для получения рейтинга
                const ratingStars = node.querySelectorAll('.business-rating-badge-view__star');
                const rating = ratingStars.length || 'Без рейтинга';

                const reviewText = node.querySelector('.business-review-view__body-text') ? node.querySelector('.business-review-view__body-text').innerText : 'Текст отсутствует';

                reviewsArray.push({
                    author: author,
                    rating: rating,
                    date: date,
                    reviewText: reviewText
                });
            });

            console.log(`${reviewsArray.length} отзывов извлечено.`);
            return reviewsArray;
        });

        console.log('Сохранение отзывов в файл JSON...');
        // Сохранение отзывов в файл JSON
        fs.writeFileSync('reviews2.json', JSON.stringify(reviews, null, 2));

        console.log('Отзывы сохранены в файл reviews.json');

        await browser.close();
        console.log('Браузер закрыт.');
    } catch (error) {
        console.error('Ошибка выполнения скрипта:', error);
    }
})();
