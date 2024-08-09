
fetch('parse_reviews_google.php')
    .then(response => response.json())
    .then(data => {
        if (data.logs) {
            data.logs.forEach(log => console.log(log));
        }
        if (data.error) {
            console.error('Ошибка:', data.error);
        }
        if (data.reviews) {
            console.log('Отзывы:', data.reviews);
        }
    })
    .catch(error => console.error('Ошибка запроса:', error));

