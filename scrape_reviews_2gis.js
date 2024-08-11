const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Запуск браузера...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Переход на страницу с отзывами
        console.log('Переход на страницу с отзывами...');
        await page.goto('https://2gis.ru/n_novgorod/inside/2674647933966364/firm/70000001021080960/tab/reviews?m=43.999939%2C56.311007%2F16%2Fp%2F0.3', { waitUntil: 'networkidle2' });

        // Ждем появления блока отзывов
        const reviewBlockSelector = '._11gvyqv'; // Убедитесь, что этот селектор корректен
        console.log('Ожидание появления блока отзывов...');
        await page.waitForSelector(reviewBlockSelector);

        console.log('Извлечение отзывов...');
        // Извлечение отзывов
        const reviews = await page.evaluate(() => {
            const reviewNodes = document.querySelectorAll('._11gvyqv');

            if (reviewNodes.length === 0) {
                console.warn('Предупреждение: Отзывы не найдены!');
            }

            const reviewsArray = [];
            reviewNodes.forEach(node => {
                const authorElement = node.querySelector('._16s5yj36');
                const dateElement = node.querySelector('._4mwq3d');

                // Попробуем несколько селекторов для текста отзыва
                const textElement1 = node.querySelector('._ayej9u3'); // Первый возможный селектор
                const textElement2 = node.querySelector('._1it5ivp'); // Второй возможный селектор
                const textElement3 = node.querySelector('._49x36f'); // Третий возможный селектор

                // Извлечение текста из первого существующего элемента
                const text = textElement1 ? textElement1.innerText :
                             textElement2 ? textElement2.innerText :
                             textElement3 ? textElement3.innerText : 
                             'Текст отсутствует';

                // Извлечение рейтинга
                const ratingFullStars = node.querySelectorAll('._1fkin5c span').length;
                const ratingEmptyStars = node.querySelectorAll('._1ixuu7m span').length;

                const rating = ratingFullStars + ratingEmptyStars > 0 ? ratingFullStars : 'Без рейтинга';

                reviewsArray.push({
                    author: authorElement ? authorElement.innerText : 'Неизвестный автор',
                    date: dateElement ? dateElement.innerText : 'Дата отсутствует',
                    rating: rating,
                    text: text
                });
            });

            console.log(`${reviewsArray.length} отзывов извлечено.`);
            return reviewsArray;
        });

        console.log('Сохранение отзывов в файл JSON...');
        // Сохранение отзывов в файл JSON
        fs.writeFileSync('reviews.json', JSON.stringify(reviews, null, 2));

        console.log('Отзывы сохранены в файл reviews.json');

        await browser.close();
        console.log('Браузер закрыт.');
    } catch (error) {
        console.error('Ошибка выполнения скрипта:', error);
    }
})();
