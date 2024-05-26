function fastRandString() {
    return [...Array(50)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
}

module.exports = { fastRandString };
