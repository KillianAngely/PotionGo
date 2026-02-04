package com.example.potiongo.ui.navigation

import androidx.lifecycle.ViewModel
import com.example.potiongo.domain.IsAuthenticateUseCase
import com.example.potiongo.domain.IsAuthenticateUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject


@HiltViewModel
class AppNavHostViewModel @Inject constructor(
    val isAuthenticateUseCase : IsAuthenticateUseCase
): ViewModel() {

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    init {
        when(val res = isAuthenticateUseCase()){
            is IsAuthenticateUseCaseResult.Success -> {
                _isAuthenticated.value = res.isAuthenticated
            }
            is IsAuthenticateUseCaseResult.ErrorAuth -> {
                _isAuthenticated.value = false
            }
        }
    }

}