package com.example.potiongo.ui.screens.userprofile

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.GetUserProfileUseCase
import com.example.potiongo.domain.GetUserProfileUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val getUserProfileUseCase: GetUserProfileUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val userId: String = savedStateHandle["userId"] ?: ""

    private val _uiState = MutableStateFlow<UserProfileUiState>(UserProfileUiState.Loading)
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = UserProfileUiState.Loading
            when (val result = getUserProfileUseCase(userId)) {
                is GetUserProfileUseCaseResult.Success -> {
                    _uiState.value = UserProfileUiState.Loaded(
                        user = result.user,
                        ratings = result.ratings
                    )
                }
                is GetUserProfileUseCaseResult.Error -> {
                    _uiState.value = UserProfileUiState.Error("Unable to load profile")
                }
            }
        }
    }
}
