const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Запуск браузера...');
        const browser = await puppeteer.launch({ headless: false }); // Запуск браузера в видимом режиме
        const page = await browser.newPage();

        // Переход на страницу с отзывами
        console.log('Переход на страницу с отзывами...');
        await page.goto('https://2gis.ru/n_novgorod/inside/2674647933966364/firm/70000001021080960/tab/reviews?m=43.999939%2C56.311007%2F16%2Fp%2F0.3', { waitUntil: 'networkidle2' });

        // Ждем появления блока отзывов
        const scrollableDivSelector = '._jcreqo'; // Убедитесь, что этот селектор корректен
        console.log('Ожидание появления блока отзывов...');
        await page.waitForSelector(scrollableDivSelector);

        console.log('Проверка и прокрутка блока...');
        // Прокрутка блока для загрузки всех отзывов
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
