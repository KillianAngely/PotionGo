package com.example.potiongo.ui.screens.auth.emailVerif


import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.EmailVerifUseCase
import com.example.potiongo.domain.EmailVerifUseCaseResult
import com.example.potiongo.ui.screens.auth.login.LoginUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class EmailVerifViewModel @Inject constructor(
    private val emailVerifUseCase: EmailVerifUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow<EmailVerifUiState>(EmailVerifUiState.Idle)

    val uiState: StateFlow<EmailVerifUiState> = _uiState.asStateFlow()


    fun isEmailVerified() {
        viewModelScope.launch {
            when(emailVerifUseCase()){
                is EmailVerifUseCaseResult.Success ->{
                    _uiState.value = EmailVerifUiState.Success
                }
                is EmailVerifUseCaseResult.NotVerified ->{

                }
            }
        }
    }

}