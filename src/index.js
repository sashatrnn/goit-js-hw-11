import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import axios from 'axios';

const form = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');
const elementToObserve = document.querySelector('.elementToObserve');

let simplelightbox = new SimpleLightbox('.gallery a');

form.addEventListener('submit', onSubmitForm);

const options = {
  root: null,
  rootMargin: '400px',
  threshold: 0.0,
};

const observer = new IntersectionObserver(onInfinityScroll, options);

let page = 1;
let searchQuery = '';
let totalPages = null;
const pageCount = 40;

async function GalleryApiService(query, page) {
  const API_KEY = '36228966-b16b8f4a94cb64b768634e65a';
  const BASE_URL = 'https://pixabay.com/api/';
  const PARAMS = new URLSearchParams({
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: pageCount,
    page: page,
  });

  try {
    const response = await axios.get(`${BASE_URL}?${PARAMS}`);
    const { data } = response;
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function onSubmitForm(e) {
  e.preventDefault();
  page = 1;
  searchQuery = e.currentTarget.elements.searchQuery.value.trim();
  clearMarkup();
  observer.unobserve(elementToObserve);

  if (!searchQuery) {
    Notiflix.Notify.failure('Please, enter query!');
    return;
  }

  try {
    const data = await GalleryApiService(searchQuery, page);
    totalPages = Math.ceil(data.totalHits / pageCount);

    if (!data.hits.length) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    if (data.hits) {
      Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
      renderImageGallery(data.hits);
      simplelightbox.refresh();
    }
    if (page !== totalPages) {
      observer.observe(elementToObserve);
    }
  } catch (error) {
    console.log(error);
  }
}

function onInfinityScroll(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      page += 1;
      try {
        const data = await GalleryApiService(searchQuery, page);
        renderImageGallery(data.hits);
        simplelightbox.refresh();

        totalPages = Math.ceil(data.totalHits / pageCount);
        if (page === totalPages) {
          observer.unobserve(elementToObserve);
          Notiflix.Notify.info(
            'We are sorry, but you have reached the end of search results.'
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
}

function clearMarkup() {
  gallery.innerHTML = '';
}

function renderImageGallery(images) {
  const markup = images
    .map(
      ({
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<div class="photo-card">
          <a class="gallery-item" href=${largeImageURL}>
            <img src=${webformatURL} alt=${tags}" loading="lazy" />
          </a>
          <div class="info">
            <p class="info-item">
              <b>Likes:</b> ${likes}
            </p>
            <p class="info-item">
              <b>Views:</b> ${views}
            </p>
            <p class="info-item">
              <b>Comments:</b> ${comments}
            </p>
            <p class="info-item">
              <b>Downloads:</b> ${downloads}
            </p>
          </div>
        </div>`
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
}
