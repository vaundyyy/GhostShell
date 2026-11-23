package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.rating.RatingRequest;
import com.dsmovie.application.port.in.SaveRatingUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RatingControllerValidationTest {

    @Test
    void shouldRejectRatingWithoutRequiredMovieId() throws Exception {
        SaveRatingUseCase useCase = mock(SaveRatingUseCase.class);
        RatingController controller = new RatingController(useCase);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new com.dsmovie.infrastructure.exception.GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();

        mockMvc.perform(post("/api/ratings")
                        .principal(() -> "7")
                        .contentType("application/json")
                        .content("{\"value\":4.5}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectRatingOutOfRange() throws Exception {
        SaveRatingUseCase useCase = mock(SaveRatingUseCase.class);
        RatingController controller = new RatingController(useCase);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new com.dsmovie.infrastructure.exception.GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();

        mockMvc.perform(post("/api/ratings")
                        .principal(() -> "7")
                        .contentType("application/json")
                        .content("{\"movieId\":1,\"value\":6.0}"))
                .andExpect(status().isBadRequest());
    }
}

