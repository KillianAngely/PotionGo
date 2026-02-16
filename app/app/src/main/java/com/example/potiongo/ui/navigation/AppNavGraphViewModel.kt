package com.example.potiongo.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.IsAuthenticateUseCase
import com.example.potiongo.domain.IsAuthenticateUseCaseResult
import com.example.potiongo.domain.SaveFcmTokenUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class AppNavHostViewModel @Inject constructor(
    val isAuthenticateUseCase: IsAuthenticateUseCase,
    private val saveFcmTokenUseCase: SaveFcmTokenUseCase
): ViewModel() {

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    init {
        when(val res = isAuthenticateUseCase()){
            is IsAuthenticateUseCaseResult.Success -> {
                _isAuthenticated.value = res.isAuthenticated
                if (res.isAuthenticated) {
                    viewModelScope.launch {
                        saveFcmTokenUseCase()
                    }
                }
            }
            is IsAuthenticateUseCaseResult.ErrorAuth -> {
                _isAuthenticated.value = false
            }
        }
    }
}
